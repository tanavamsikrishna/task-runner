import { getChild, isTaskTable } from './tree.ts';
import type { TaskNode, TaskTree } from './types.ts';

export function printCompletionsScript(shell: string | undefined): void {
  if (shell === 'fish') {
    process.stdout.write(
      `complete -c trn -a '(trn --completions (commandline | string split " "))' -f\n`,
    );
  }
}

/**
 * Compute completion candidates as `name` or `name\tdescription` lines.
 *
 * Fish passes the program name as the first argument (`trn --completions trn
 * task1 ...`), nushell does not — disambiguate by checking whether the first
 * argument is a root-level task. The last argument is the partial word to
 * complete; the preceding ones form the path into the task tree.
 */
export function completionCandidates(tasks: TaskTree, rawArgs: string[]): string[] {
  let node: TaskNode = tasks;
  let partialWord = '';

  // Trim whitespace from all arguments (handles "task2 " with trailing space)
  const args = rawArgs.map((arg) => arg.trim());

  if (args.length > 0 && getChild(node, args[0]!) !== undefined) {
    // First arg is a task, so there's no program name - navigate into it
    const value = getChild(node, args[0]!);
    if (isTaskTable(value)) {
      node = value;
    }
    args.shift();
  } else if (args.length > 0) {
    // First arg is not a task, assume it's the program name - remove it
    args.shift();
  }

  if (args.length > 0) {
    partialWord = args.pop()!;
    // A complete task name as the partial word (tab after "task2 ") means
    // navigate into it and list its sub-tasks
    const value = getChild(node, partialWord);
    if (isTaskTable(value)) {
      node = value;
      partialWord = '';
    }
  }

  // Navigate to the level the path segments point at
  for (const pathSegment of args) {
    const child = getChild(node, pathSegment);
    if (child === undefined) {
      return [];
    }
    node = child;
  }

  if (!isTaskTable(node)) {
    return [];
  }

  const candidates: string[] = [];
  for (const [taskName, taskValue] of Object.entries(node)) {
    if (taskName.startsWith('_')) {
      continue;
    }
    if (partialWord.length === 0 || taskName.startsWith(partialWord)) {
      let desc: string | undefined;
      if (isTaskTable(taskValue) && typeof taskValue._desc === 'string') {
        desc = taskValue._desc;
      } else if (typeof taskValue === 'string') {
        // The command string itself serves as a simple description
        desc = taskValue;
      }
      candidates.push(desc === undefined ? taskName : `${taskName}\t${desc}`);
    }
  }
  return candidates;
}
