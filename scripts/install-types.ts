// Makes task-file types (and the `trn/helpers` runtime) available to any
// `tasks.ts` under ~/repo with no per-project setup — WITHOUT `trn`
// imperatively writing into `~/repo/node_modules`. pnpm owns that space:
// this script generates a tiny `trn` package inside this repo, then
// `pnpm add`s it (plus `@types/bun`) into a package manager-managed
// `~/repo/package.json`. Since Bun and the TypeScript language server
// resolve bare imports by walking up parent directories, every task file
// under ~/repo (e.g. scripts/hammerspoon/tasks.ts) then sees the `trn`
// types, `import { runPrefixed } from 'trn/helpers'`, and the Bun globals.
// pnpm's isolated layout (symlinks into `node_modules/.pnpm`) is fine:
// Bun and TypeScript follow those symlinks. Task files outside ~/repo
// no longer resolve these — $HOME itself stays free of a node_modules.
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { $ } from "bun";
import { version } from "../package.json";

const home = process.env["HOME"];
if (!home) {
  console.error("HOME is not set; cannot locate ~/repo.");
  process.exit(1);
}

const repo = resolve(import.meta.dir, "..");
// Install target: ~/repo itself (not $HOME), so resolution covers exactly
// the task files under ~/repo and nothing else.
const installDir = resolve(home, "repo");

// 1. Generate the `trn` package: types from src/types.ts (must stay free of
//    runtime code — runner-internal helpers live in src/tree.ts) plus the
//    user-facing runtime at src/helpers.ts, imported as `trn/helpers`. This is
//    a build artifact (gitignored), linked into ~/repo/node_modules by pnpm below.
const pkgDir = resolve(repo, "types-dist");
await mkdir(pkgDir, { recursive: true });
await Bun.write(
  `${pkgDir}/index.d.ts`,
  await Bun.file(`${repo}/src/types.ts`).text(),
);
await Bun.write(
  `${pkgDir}/helpers.ts`,
  await Bun.file(`${repo}/src/helpers.ts`).text(),
);
await Bun.write(
  `${pkgDir}/package.json`,
  JSON.stringify(
    {
      name: "trn",
      version,
      types: "index.d.ts",
      exports: {
        ".": { types: "./index.d.ts" },
        "./helpers": "./helpers.ts",
      },
    },
    null,
    2,
  ) + "\n",
);

// 2. Pin @types/bun to the version this repo uses, so the globally available
//    Bun types match the Bun that runs trn.
const bunTypesVersion = (
  (await Bun.file(`${repo}/node_modules/@types/bun/package.json`).json()) as {
    version: string;
  }
).version;

// 3. Hand ~/repo/node_modules to pnpm: declare both in a managed
//    ~/repo/package.json. `@types/bun` pulls its own transitive chain
//    (bun-types, @types/node, undici-types) automatically — no need to
//    enumerate it here. pnpm creates package.json if absent; seed a
//    minimal one first so it does not generate boilerplate fields.
await mkdir(installDir, { recursive: true });
const installPkg = `${installDir}/package.json`;
if (!existsSync(installPkg)) {
  await Bun.write(
    installPkg,
    JSON.stringify({ name: "repo", private: true }, null, 2) + "\n",
  );
}
await $`pnpm add ${`@types/bun@${bunTypesVersion}`} ${`trn@file:${pkgDir}`}`.cwd(
  installDir,
);

console.log(
  `Installed trn v${version} + @types/bun@${bunTypesVersion} into ${installPkg} (via pnpm)`,
);
