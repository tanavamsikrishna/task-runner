// Type declarations only — this file is published verbatim as the global
// `trn` types package (~/node_modules/trn/index.d.ts) by scripts/install-types.ts.
// Do not add runtime code here. Runner-internal value helpers belong in
// tree.ts; user-facing helpers live in helpers.ts (`trn/helpers`).

/**
 * A runnable is either a shell command string or a function.
 * Functions receive the program arguments (everything after `--`) spread
 * positionally and may be async.
 */
export type Runnable = string | ((...progArgs: string[]) => unknown);

/**
 * A table node is a namespace of sub-tasks and/or a detailed task.
 * Keys starting with `_` are reserved: `_desc`, `_action`, `_setup`.
 */
export type TaskTable = {
  _desc?: string;
  _action?: Runnable;
  _setup?: Runnable;
} & {
  [key: string]: TaskNode | string | undefined;
};

export type TaskNode = Runnable | TaskTable;

/** The shape of a `tasks.ts` default export. */
export type TaskTree = Record<string, TaskNode>;
