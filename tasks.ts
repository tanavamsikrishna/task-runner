// Task definitions for this repo, and the demo of the tasks.ts format.

import { $ } from 'bun';
import { runPrefixed } from './src/helpers.ts';
import type { TaskTree } from './src/types.ts';

async function task1() {
  await $`git status`;
  console.log('Ran git status; task 1 executed!');
}

function task2_1() {
  console.log('task2.task1 executed!');
}

function task2_2() {
  console.log('task2.task2 executed!');
}

async function testProcessOutputStreaming() {
  await $`echo hello`;
}

export default {
  deploy:
    'chmod +x src/main.ts && mkdir -p ~/.local/bin && ln -sfn "$PWD/src/main.ts" ~/.local/bin/trn && ln -sfn src/main.ts trn && bun run install-types',
  format: 'bunx prettier --write src tests tasks.ts',
  local: task1,
  fn_with_args: (arg1?: string, arg2?: string) => {
    console.log(arg1, arg2);
  },
  task2: {
    _setup: () => {
      console.log('Setup for task2');
    },
    task1: {
      _desc: 'Run task2.task1',
      _action: task2_1,
    },
    task2: task2_2,
    test: () => {
      console.log(JSON.parse('{"Hello":["bun",1.5]}'));
    },
    _desc: 'Run task2 related tasks',
    test1: async () => {
      await $`sleep 2`;
    },
  },
  task3: {
    _setup: async () => {
      await $`echo setup run`;
    },
    _action: 'echo Hello',
  },
  task4: {
    _setup: 'echo setup',
    _action: 'echo Hello',
  },
  task5: {
    _action: (...progArgs: string[]) => {
      console.log(progArgs.join('|'));
    },
    _desc: 'Just a regular task5',
  },
  testProcessOutputStreaming,
  prefixed: {
    _desc: 'Demo of runPrefixed (tag each line of stdout/stderr)',
    _action: async () => {
      await Promise.all([
        runPrefixed('out', 'echo hello; echo world'),
        runPrefixed('err', 'echo oops >&2'),
      ]);
    },
  },
} satisfies TaskTree;
