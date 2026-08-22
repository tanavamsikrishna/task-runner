/**
 * User-facing helpers for function tasks in `tasks.ts`.
 *
 * `runPrefixed` executes a command string via `/bin/sh -c` and prepends a dim
 * `[tag] ` to each line of stdout and stderr as they stream. Non-zero exits
 * throw an Error with numeric `exitCode` so the runner's existing failure path
 * applies. String tasks do not use this; import from `trn/helpers` (this repo:
 * `./src/helpers.ts`).
 */

const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

/** Dim `[tag]` plus a trailing space — the prefix written before each output line. */
export function formatTag(tag: string): string {
  return `${DIM}[${tag}]${RESET} `;
}

function stripTrailingCr(line: string): string {
  return line.endsWith('\r') ? line.slice(0, -1) : line;
}

/**
 * Consume a decoded stdout/stderr chunk. Complete lines are returned already
 * prefixed; the first tuple element is the incomplete tail. Pass `eof: true`
 * after the last chunk (`chunk` may be '') to flush a leftover partial line.
 */
export function applyLinePrefix(
  pending: string,
  chunk: string,
  tag: string,
  eof = false,
): [pending: string, output: string] {
  const parts = (pending + chunk).split('\n');
  let next = parts.pop() ?? '';
  let output = '';
  for (const part of parts) {
    output += tag + stripTrailingCr(part) + '\n';
  }
  if (eof && next !== '') {
    output += tag + stripTrailingCr(next) + '\n';
    next = '';
  }
  return [next, output];
}

async function pipePrefixed(
  stream: ReadableStream<Uint8Array>,
  dest: NodeJS.WritableStream,
  tag: string,
): Promise<void> {
  const decoder = new TextDecoder();
  const reader = stream.getReader();
  let pending = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      const [next, output] = applyLinePrefix(pending, decoder.decode(value, { stream: true }), tag);
      pending = next;
      if (output !== '') {
        dest.write(output);
      }
    }
  } finally {
    reader.releaseLock();
  }
  const [, tail] = applyLinePrefix(pending, decoder.decode(), tag, true);
  if (tail !== '') {
    dest.write(tail);
  }
}

/**
 * Run `command` with `/bin/sh -c`, prepending a dim `[tag] ` to each line of
 * stdout and stderr. `tag` is the label only (e.g. `'git status'`).
 */
export async function runPrefixed(tag: string, command: string): Promise<void> {
  const prefix = formatTag(tag);
  const proc = Bun.spawn(['/bin/sh', '-c', command], {
    stdin: 'inherit',
    stdout: 'pipe',
    stderr: 'pipe',
  });

  await Promise.all([
    pipePrefixed(proc.stdout, process.stdout, prefix),
    pipePrefixed(proc.stderr, process.stderr, prefix),
  ]);

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const err = new Error(`Command failed (exit ${exitCode}): ${command}`) as Error & {
      exitCode: number;
    };
    err.exitCode = exitCode;
    throw err;
  }
}
