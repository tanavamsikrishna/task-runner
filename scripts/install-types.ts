// Makes the task-file types available to any `tasks.ts` under the home
// directory with no per-project setup — WITHOUT `trn` imperatively writing into
// the global `~/node_modules`. Bun owns that space: this script generates a
// tiny declaration-only `trn` package inside the repo, then `bun add`s it (plus
// `@types/bun`) into a package manager-managed `~/package.json`. Since Bun and
// the TypeScript language server resolve bare imports by walking up parent
// directories, every task file under $HOME then sees both the `trn` types and
// the Bun globals (`Bun`, `$`, `process`, `Buffer`).
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { $ } from 'bun';
import { version } from '../package.json';

const home = process.env['HOME'];
if (!home) {
  console.error('HOME is not set; cannot locate the global node_modules.');
  process.exit(1);
}

const repo = resolve(import.meta.dir, '..');

// 1. Generate the declaration-only `trn` package (a verbatim copy of
//    src/types.ts, which must stay free of runtime code — value helpers live in
//    src/tree.ts). This is a build artifact (gitignored), linked into
//    ~/node_modules by Bun below.
const pkgDir = resolve(repo, 'types-dist');
await mkdir(pkgDir, { recursive: true });
await Bun.write(`${pkgDir}/index.d.ts`, await Bun.file(`${repo}/src/types.ts`).text());
await Bun.write(
  `${pkgDir}/package.json`,
  JSON.stringify({ name: 'trn', version, types: 'index.d.ts' }, null, 2) + '\n',
);

// 2. Pin @types/bun to the version this repo builds against, so the globally
//    available Bun types match the runtime the binary is compiled with.
const bunTypesVersion = (
  (await Bun.file(`${repo}/node_modules/@types/bun/package.json`).json()) as { version: string }
).version;

// 3. Hand ~/node_modules to Bun: declare both in a managed ~/package.json.
//    `@types/bun` pulls its own transitive chain (bun-types, @types/node,
//    undici-types) automatically — no need to enumerate it here.
await $`bun add ${`@types/bun@${bunTypesVersion}`} ${`trn@file:${pkgDir}`}`.cwd(home);

console.log(`Installed trn v${version} + @types/bun@${bunTypesVersion} into ${home}/package.json`);
