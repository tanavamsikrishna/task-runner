import { $ } from 'bun';
import { getChild, isTaskTable } from './tree.ts';
import type { Runnable, TaskNode } from './types.ts';

const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

/**
 * Report an error thrown while running a task, then exit. Bun's `$` streams the
 * failing command's own output by default, so for a shell failure (duck-typed by
 * a numeric `exitCode`) we print only a contextual line and propagate the real
 * exit code. Anything else is an unexpected bug — keep its stack.
 */
function reportRunError(label: string, err: unknown): never {
  if (err !== null && typeof err === 'object' && typeof (err as { exitCode?: unknown }).exitCode === 'number') {
    const code = (err as { exitCode: number }).exitCode;
    process.stderr.write(`${RED}Task \`${label}\` failed${RESET} (exit code ${code})\n`);
    process.exit(code || 1);
  }
  const detail = err instanceof Error ? (err.stack ?? err.message) : String(err);
  process.stderr.write(`${RED}Task \`${label}\` failed${RESET}\n${detail}\n`);
  process.exit(1);
}

async function executeRunnable(
  runnable: TaskNode | undefined,
  progArgs?: string[],
): Promise<boolean> {
  if (typeof runnable === 'string') {
    process.stderr.write(`${DIM}Running \`${runnable}${RESET}\`\n`);
    const result = await $`${{ raw: runnable }}`.nothrow();
    if (result.exitCode !== 0) {
      process.exit(result.exitCode);
    }
  } else if (typeof runnable === 'function') {
    await runnable(...(progArgs ?? []));
  } else {
    return false;
  }
  return true;
}

/**
 * Walk `taskSeq` through the task tree and run the target.
 * The last `_setup` seen along the path wins (not a stack) and runs first.
 * A table target is unwrapped to its `_action`.
 * Returns an error message, or undefined on success.
 */
export async function executeTask(
  taskSeq: string[],
  tasks: TaskNode,
  progArgs: string[],
): Promise<string | undefined> {
  let setupRunnable: Runnable | undefined;
  const updateSetup = (node: TaskNode) => {
    if (isTaskTable(node) && node._setup !== undefined) {
      setupRunnable = node._setup;
    }
  };

  let node: TaskNode = tasks;
  updateSetup(node);
  for (const taskName of taskSeq) {
    const child = getChild(node, taskName);
    if (child === undefined) {
      return `Task \`${taskSeq.join(' ')}\` not found`;
    }
    node = child;
    updateSetup(node);
  }

  if (isTaskTable(node) && node._action !== undefined) {
    node = node._action;
  }

  const label = taskSeq.join(' ');
  if (setupRunnable !== undefined) {
    try {
      if (!(await executeRunnable(setupRunnable))) {
        return `Setup for \`${label}\` is not a runnable`;
      }
    } catch (err) {
      reportRunError(label, err);
    }
  }
  try {
    if (!(await executeRunnable(node, progArgs))) {
      return `Action for \`${label}\` is not a runnable`;
    }
  } catch (err) {
    reportRunError(label, err);
  }
  return undefined;
}

/** Split argv into the task path and the program args, separated by `--`. */
export function splitArguments(cmdLineArgs: string[]): [taskSeq: string[], progArgs: string[]] {
  const taskSeq: string[] = [];
  const progArgs: string[] = [];
  let current = taskSeq;
  for (const arg of cmdLineArgs) {
    if (arg === '--') {
      current = progArgs;
    } else {
      current.push(arg);
    }
  }
  return [taskSeq, progArgs];
}
