import { $ } from 'bun';
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

export default {
  deploy:
    'bun run build && mkdir -p ~/.local/bin && cp trn ~/.local/bin/trn && bun run install-types',
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
} satisfies TaskTree;
