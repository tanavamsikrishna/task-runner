# Task Runner

A lightweight, flexible task runner written in TypeScript, built with Bun. It allows users to define tasks in a `tasks.ts` file using plain objects, functions, or shell strings.

## Project Overview

- **Core Technology:** Bun + TypeScript (zero runtime dependencies; `Bun.$` for shell execution)
- **Distribution:** single standalone binary compiled with `bun build --compile` — target machines need neither Bun nor Node
- **Key Components:**
  - `src/main.ts`: CLI entry point (argv dispatch).
  - `src/execute.ts`, `src/help.ts`, `src/completions.ts`, `src/load.ts`, `src/types.ts`: runner logic.
  - `tasks.ts`: The configuration file where tasks are defined (this repo's own doubles as the demo).

## Building and Running

### Build & Install

```bash
bun install            # dev dependencies only (types, tsc)
bun run build          # compiles ./trn via `bun build --compile --minify --bytecode`
bun run install-types  # bun add's the `trn` + `@types/bun` types into ~/package.json
trn deploy             # or: all of the above + copies ./trn to ~/.local/bin (must be on PATH)
```

During development, run the runner from source: `bun src/main.ts <task>`.

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
import { helpers } from '../shared/helpers.ts';
```

Typing the export with `satisfies TaskTree` gives compile-time/editor validation:

```ts
import type { TaskTree } from 'trn';

export default {
  // ...
} satisfies TaskTree;
```

`bun run install-types` (part of `trn deploy`) makes this resolve from any `tasks.ts` under the home directory with no per-project setup. Rather than write into `~/node_modules` directly, it lets Bun own that space: it `bun add`s two things into a package manager-managed `~/package.json` (creating it if absent) —

- **`trn`** — a `file:` dependency on `types-dist/`, a declaration-only package the script generates from a verbatim copy of `src/types.ts` (which must stay free of runtime code — value helpers live in `src/tree.ts`). `types-dist/` is a gitignored build artifact. Don't import `trn` as a value; there is no JavaScript behind it.
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
- **One-shot CLI principle:** `trn` starts, does one thing, and exits — keep startup work minimal (argv-first dispatch, no runtime dependencies, no caches or persistent state). The release build uses `--minify --bytecode`; because bytecode requires CJS-compatible output, `src/main.ts` must not use top-level `await`.
