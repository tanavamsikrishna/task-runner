import { existsSync } from 'node:fs';
import { isTaskTable } from './tree.ts';
import type { TaskTree } from './types.ts';

const TASK_FILES = ['tasks.ts', 'tasks.js'];

/** Load the tasks file from the current directory. Exits the process on failure. */
export async function loadTasks(): Promise<TaskTree> {
  const cwd = process.cwd();
  const taskFile = TASK_FILES.find((name) => existsSync(`${cwd}/${name}`));
  if (taskFile === undefined) {
    process.stderr.write(`Error loading tasks file:\nNo tasks.ts (or tasks.js) found in ${cwd}\n`);
    process.exit(1);
  }
  let mod: { default?: unknown };
  try {
    mod = await import(`${cwd}/${taskFile}`);
  } catch (err) {
    const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
    process.stderr.write(`Error loading tasks file:\n${message}\n`);
    process.exit(1);
  }
  const tasks = mod.default;
  if (!isTaskTable(tasks) || typeof tasks === 'function') {
    process.stderr.write('Tasks file needs to export default a tasks object.\n');
    process.exit(1);
  }
  return tasks as TaskTree;
}
