import { describe, expect, test } from 'bun:test';
import { completionCandidates } from '../src/completions.ts';
import type { TaskTree } from '../src/types.ts';

// Mirrors the shape of this repo's tasks.ts (what test-completions.nu runs against)
const tasks: TaskTree = {
  deploy: 'echo deploy',
  format: 'echo format',
  local: () => {},
  fn_with_args: () => {},
  task2: {
    _setup: () => {},
    _desc: 'Run task2 related tasks',
    task1: { _desc: 'Run task2.task1', _action: () => {} },
    task2: () => {},
    test: () => {},
    test1: () => {},
  },
  task3: { _setup: () => {}, _action: 'echo Hello' },
  task4: { _setup: 'echo setup', _action: 'echo Hello' },
  task5: { _action: () => {}, _desc: 'Just a regular task5' },
};

describe('completionCandidates (nushell style, no program name)', () => {
  test('root tasks', () => {
    expect(completionCandidates(tasks, [])).toHaveLength(8);
  });

  test('subtask (task2)', () => {
    expect(completionCandidates(tasks, ['task2'])).toHaveLength(4);
  });

  test('partial match (task2 ta)', () => {
    expect(completionCandidates(tasks, ['task2', 'ta'])).toEqual([
      'task1\tRun task2.task1',
      'task2',
    ]);
  });

  test('trailing space (task2 "")', () => {
    expect(completionCandidates(tasks, ['task2', ''])).toHaveLength(4);
  });

  test('leaf task has no candidates (task2 task1 "")', () => {
    expect(completionCandidates(tasks, ['task2', 'task1', ''])).toHaveLength(0);
  });
});

describe('completionCandidates (fish style, program name first)', () => {
  test('program name is skipped', () => {
    expect(completionCandidates(tasks, ['trn', 'task2', 'ta'])).toHaveLength(2);
  });

  test('root listing after program name', () => {
    expect(completionCandidates(tasks, ['trn', ''])).toHaveLength(8);
  });
});

describe('completionCandidates details', () => {
  test('internal _ keys are filtered out', () => {
    for (const candidate of completionCandidates(tasks, ['task2'])) {
      expect(candidate.startsWith('_')).toBe(false);
    }
  });

  test('string tasks use the command as description', () => {
    expect(completionCandidates(tasks, ['trn', 'de'])).toEqual(['deploy\techo deploy']);
  });

  test('a single non-task argument is treated as the program name (Lua parity)', () => {
    expect(completionCandidates(tasks, ['de'])).toHaveLength(8);
  });

  test('_desc is used as description', () => {
    expect(completionCandidates(tasks, ['task5'])).toEqual([]);
    expect(completionCandidates(tasks, ['trn', 'task'])).toContain('task5\tJust a regular task5');
  });

  test('whitespace around arguments is trimmed', () => {
    expect(completionCandidates(tasks, [' task2 ', ' ta '])).toHaveLength(2);
  });

  test('invalid path yields no candidates', () => {
    expect(completionCandidates(tasks, ['nope', 'x', ''])).toHaveLength(0);
  });

  test('inherited prototype properties are not tasks', () => {
    expect(completionCandidates(tasks, ['trn', 'constructor', ''])).toHaveLength(0);
  });
});
