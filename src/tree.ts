import type { TaskNode, TaskTable } from './types.ts';

export function isTaskTable(node: unknown): node is TaskTable {
  return typeof node === 'object' && node !== null;
}

/**
 * Task tables are plain objects, but unlike Lua tables they have a prototype
 * chain — look up keys with hasOwn so e.g. `constructor` is not a task.
 */
export function getChild(node: TaskNode, key: string): TaskNode | undefined {
  if (!isTaskTable(node) || !Object.hasOwn(node, key)) {
    return undefined;
  }
  return node[key] as TaskNode | undefined;
}
