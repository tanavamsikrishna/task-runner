import type { TaskNode } from './types.ts';

const CODE_FG = '\x1b[37m';
const DOC_FG = '\x1b[3m\x1b[34m';
const RESET = '\x1b[0m';

type HelpLine = [taskPath: string, doc: string];

export function buildHelp(taskTree: TaskNode, lines: HelpLine[], parentPath: string[]): void {
  const parentPathStr = parentPath.join(' ');
  if (typeof taskTree === 'function') {
    lines.push([parentPathStr, '']);
    return;
  }
  if (typeof taskTree === 'string') {
    lines.push([parentPathStr, `${CODE_FG}$ ${taskTree}${RESET}`]);
    return;
  }
  for (const [key, value] of Object.entries(taskTree)) {
    if (key === '_desc') {
      lines.push([parentPathStr, `${DOC_FG}${value}${RESET}`]);
    } else if (key === '_action' && typeof value === 'string') {
      lines.push([parentPathStr, `${CODE_FG}$ ${value}${RESET}`]);
    } else if (key !== '_action' && key !== '_setup' && value !== undefined) {
      parentPath.push(key);
      buildHelp(value, lines, parentPath);
      parentPath.pop();
    }
  }
}

export function printTwoColumnTable(lines: HelpLine[]): void {
  lines.sort((e1, e2) => (e1[0] < e2[0] ? -1 : e1[0] > e2[0] ? 1 : 0));
  let maxLen = 0;
  for (const [taskPath] of lines) {
    maxLen = Math.max(maxLen, taskPath.length);
  }
  let out = 'Tasks:\n\n';
  for (const [taskPath, doc] of lines) {
    out += `${taskPath.padEnd(maxLen)}   ${doc}\n`;
  }
  process.stdout.write(out);
}
