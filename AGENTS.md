# Task Runner

A lightweight, flexible task runner written in TypeScript, built with Bun. It allows users to define tasks in a `tasks.ts` file using plain objects, functions, or shell strings.

## Project Overview

- **Core Technology:** Bun + TypeScript (zero runtime dependencies; `Bun.$` for shell execution)
- **Distribution:** `~/.local/bin/trn` is a symlink to `src/main.ts`, executed by Bun through a shebang. `bun` must be on `PATH`.
- **Key Components:**
  - `src/main.ts`: CLI entry point (argv dispatch).
  - `src/execute.ts`, `src/help.ts`, `src/completions.ts`, `src/load.ts`, `src/types.ts`: runner logic.
  - `src/helpers.ts`: user-facing helpers for function tasks (`runPrefixed`), published as `trn/helpers`.
  - `tasks.ts`: The configuration file where tasks are defined (this repo's own doubles as the demo).

## Building and Running

### Build & Install

```bash
bun install            # dev dependencies only (types, tsc)
bun run install-types  # bun add's the `trn` + `@types/bun` types into ~/package.json
bun src/main.ts deploy # symlinks ~/.local/bin/trn and ./trn to src/main.ts, then refreshes types
```

During development, `./trn <task>` and `bun src/main.ts <task>` are the same program.

### Usage

The `trn` tool looks for a `tasks.ts` (fallback: `tasks.js`) file in the current working directory.

**List Tasks:**
Running `trn` without arguments will list all available tasks defined in `tasks.ts`.
```bash
trn
```

**Run a Task:**
```bash
trn <task_name>
# Example from local tasks.ts
trn format
```

**Run Nested Tasks:**
Tasks can be organized into namespaces (nested objects).
```bash
trn <namespace> <task_name>
# Example
trn task2 task1
```

**Pass Program Arguments:**
Everything after `--` is passed to function tasks, spread positionally.
```bash
trn task5 -- a b c
```

## Configuration (`tasks.ts`)

The `tasks.ts` file must `export default` an object. Keys are task names, and values can be:

1.  **String:** Executes as a shell command (via `Bun.$`; a non-zero exit code exits `trn` with that code).
    ```ts
    list: 'ls -la'
    ```
2.  **Function:** Executes as TypeScript code. May be async (it is awaited). Receives the program args (after `--`) spread positionally: `(...progArgs: string[]) => unknown`.
    ```ts
    greet: () => console.log('Hello World')
    ```
3.  **Object (Namespace or Detailed Task):**
    - Can contain `_desc` (description), `_setup` (pre-requisite), and `_action` (main logic).
    - Can contain nested keys for sub-tasks.
    - The last `_setup` seen along the invoked task path runs first (not a stack — only one setup runs).

    ```ts
    deploy: {
      _desc: 'Deploy the application',
      _setup: () => console.log('Checking auth...'),
      _action: 'ansible-playbook deploy.yml',
    }
    ```

Task files can import anything: other TypeScript files from any directory (ESM resolution is relative to `tasks.ts` itself), npm packages from the nearest `node_modules`, and Bun built-ins like `Bun.$`:

```ts
import { $ } from 'bun';
import { runPrefixed } from 'trn/helpers';
```

`runPrefixed(tag, command)` runs `command` with `/bin/sh -c` and prepends a dim `[tag] ` to each line of stdout and stderr as they stream (`tag` is the label only, e.g. `'git status'`). Non-zero exits throw an `Error` with numeric `exitCode`. Use it from function tasks when several commands' output would otherwise interleave:

```ts
serve: () =>
  Promise.all([
    runPrefixed('api', 'bun run server'),
    runPrefixed('web', 'vite'),
  ]),
```

Typing the export with `satisfies TaskTree` gives compile-time/editor validation:

```ts
import type { TaskTree } from 'trn';
import { runPrefixed } from 'trn/helpers';

export default {
  // ...
} satisfies TaskTree;
```

`bun run install-types` (part of `trn deploy`) makes this resolve from any `tasks.ts` under the home directory with no per-project setup. Rather than write into `~/node_modules` directly, it lets Bun own that space: it `bun add`s two things into a package manager-managed `~/package.json` (creating it if absent) —

- **`trn`** — a `file:` dependency on `types-dist/`, a package the script generates from a verbatim copy of `src/types.ts` (must stay free of runtime code — runner-internal helpers live in `src/tree.ts`) plus `src/helpers.ts` as the `trn/helpers` subpath. `types-dist/` is a gitignored build artifact. Don't import `trn` as a value; there is no JavaScript on the root export. Import `runPrefixed` from `trn/helpers`.
- **`@types/bun`** — pinned to this repo's version, so `import { $ } from 'bun'` and the `Bun`/`process`/`Buffer` globals type-check too. Bun pulls its transitive chain (`bun-types`, `@types/node`, `undici-types`) automatically.

Because Bun and the TypeScript language server resolve bare imports (and `@types`) by walking up parent directories, any file under `$HOME` sees both. Re-run `bun run install-types` after changing `TaskTree` or bumping Bun to refresh the pinned snapshot.

## Shell Completions

- **fish:** `trn --completions-script fish | source`
- **nushell:** use `trn-completions.nu` (`use trn-completions.nu *`)

Both call `trn --completions <args...>`, which emits `name\tdescription` candidate lines. Test with `nu test-completions.nu`.

## Development Conventions

- **Formatting:** `trn format` (prettier via bunx).
- **Typecheck:** `bun run check` (`tsc --noEmit`).
- **Tests:** `bun test` (unit) and `nu test-completions.nu` (completion contract against `./trn`).
- **One-shot CLI principle:** `trn` starts, does one thing, and exits — keep startup work minimal (argv-first dispatch, no runtime dependencies, no caches or persistent state).
