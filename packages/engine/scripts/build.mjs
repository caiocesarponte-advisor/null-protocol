import { cpSync, mkdirSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const tmpDir = resolve(root, ".tmp");
const distDir = resolve(root, "dist");

rmSync(tmpDir, { recursive: true, force: true });
rmSync(distDir, { recursive: true, force: true });

execSync("tsc --project tsconfig.build.cjs.json", { cwd: root, stdio: "inherit" });
execSync("tsc --project tsconfig.build.esm.json", { cwd: root, stdio: "inherit" });

mkdirSync(distDir, { recursive: true });
cpSync(resolve(tmpDir, "cjs/index.js"), resolve(distDir, "index.cjs"));
cpSync(resolve(tmpDir, "cjs/index.js.map"), resolve(distDir, "index.cjs.map"));
cpSync(resolve(tmpDir, "esm/index.js"), resolve(distDir, "index.mjs"));
cpSync(resolve(tmpDir, "esm/index.js.map"), resolve(distDir, "index.mjs.map"));
cpSync(resolve(tmpDir, "esm/index.d.ts"), resolve(distDir, "index.d.ts"));

rmSync(tmpDir, { recursive: true, force: true });
