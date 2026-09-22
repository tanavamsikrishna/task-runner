#!/usr/bin/env bun
// CLI entry point for `trn`: list tasks, print completions, or run one task.
// Installed by symlinking this file to ~/.local/bin/trn. Requires `bun` on PATH.

import { completionCandidates, printCompletionsScript } from './completions.ts';
import { executeTask, splitArguments } from './execute.ts';
import { buildHelp, printTwoColumnTable } from './help.ts';
import { loadTasks } from './load.ts';

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  if (argv[0] === '--completions-script') {
    printCompletionsScript(argv[1]);
    return;
  }

  const tasks = await loadTasks();
  if (argv.length === 0) {
    const helpLines: [string, string][] = [];
    buildHelp(tasks, helpLines, []);
    printTwoColumnTable(helpLines);
  } else if (argv[0] === '--completions') {
    const candidates = completionCandidates(tasks, argv.slice(1));
    if (candidates.length > 0) {
      process.stdout.write(candidates.join('\n') + '\n');
    }
  } else {
    const [taskSeq, progArgs] = splitArguments(argv);
    const errorMessage = await executeTask(taskSeq, tasks, progArgs);
    if (errorMessage !== undefined) {
      process.stderr.write(errorMessage + '\n');
      process.exitCode = 1;
    }
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
