import { describe, expect, test } from 'bun:test';
import { executeTask, splitArguments } from '../src/execute.ts';
import type { TaskTree } from '../src/types.ts';

describe('splitArguments', () => {
  test('no separator puts everything in the task path', () => {
    expect(splitArguments(['task2', 'task1'])).toEqual([['task2', 'task1'], []]);
  });

  test('arguments after -- become program args', () => {
    expect(splitArguments(['task5', '--', 'a', 'b'])).toEqual([['task5'], ['a', 'b']]);
  });

  test('empty argv', () => {
    expect(splitArguments([])).toEqual([[], []]);
  });
});

describe('executeTask', () => {
  const makeTree = (calls: string[]): TaskTree => ({
    top: (...args: string[]) => calls.push(`top(${args.join(',')})`),
    ns: {
      _setup: () => calls.push('ns.setup'),
      _desc: 'namespace',
      leaf: () => calls.push('ns.leaf'),
      detailed: {
        _desc: 'detailed task',
        _action: () => calls.push('ns.detailed.action'),
      },
      deeper: {
        _setup: () => calls.push('ns.deeper.setup'),
        leaf: () => calls.push('ns.deeper.leaf'),
      },
    },
    withSetupAction: {
      _setup: () => calls.push('wsa.setup'),
      _action: (...args: string[]) => calls.push(`wsa.action(${args.join(',')})`),
    },
  });

  test('runs a root-level function with program args spread positionally', async () => {
    const calls: string[] = [];
    expect(await executeTask(['top'], makeTree(calls), ['a', 'b'])).toBeUndefined();
    expect(calls).toEqual(['top(a,b)']);
  });

  test('unknown task returns an error message', async () => {
    const calls: string[] = [];
    expect(await executeTask(['nope', 'x'], makeTree(calls), [])).toBe('Task `nope x` not found');
    expect(calls).toEqual([]);
  });

  test('setup on an ancestor runs before a nested task', async () => {
    const calls: string[] = [];
    expect(await executeTask(['ns', 'leaf'], makeTree(calls), [])).toBeUndefined();
    expect(calls).toEqual(['ns.setup', 'ns.leaf']);
  });

  test('last _setup along the path wins (not a stack)', async () => {
    const calls: string[] = [];
    expect(await executeTask(['ns', 'deeper', 'leaf'], makeTree(calls), [])).toBeUndefined();
    expect(calls).toEqual(['ns.deeper.setup', 'ns.deeper.leaf']);
  });

  test('a table target is unwrapped to its _action, after its _setup', async () => {
    const calls: string[] = [];
    expect(await executeTask(['withSetupAction'], makeTree(calls), ['x'])).toBeUndefined();
    expect(calls).toEqual(['wsa.setup', 'wsa.action(x)']);
  });

  test('a namespace without _action is not runnable', async () => {
    const calls: string[] = [];
    expect(await executeTask(['ns', 'detailed'], makeTree(calls), [])).toBeUndefined();
    expect(calls).toEqual(['ns.setup', 'ns.detailed.action']);
    expect(await executeTask(['ns', 'deeper'], makeTree(calls), [])).toBe(
      'Action for `ns deeper` is not a runnable',
    );
  });

  test('inherited prototype properties are not tasks', async () => {
    const calls: string[] = [];
    expect(await executeTask(['constructor'], makeTree(calls), [])).toBe(
      'Task `constructor` not found',
    );
  });

  test('async function tasks are awaited', async () => {
    const calls: string[] = [];
    const tree: TaskTree = {
      slow: async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        calls.push('slow done');
      },
    };
    expect(await executeTask(['slow'], tree, [])).toBeUndefined();
    expect(calls).toEqual(['slow done']);
  });

  test('string tasks run in the shell', async () => {
    const marker = `${import.meta.dir}/.shell-ran-${process.pid}`;
    const tree: TaskTree = { touchit: `touch ${marker}` };
    expect(await executeTask(['touchit'], tree, [])).toBeUndefined();
    expect(await Bun.file(marker).exists()).toBe(true);
    await Bun.file(marker).unlink();
  });
});
