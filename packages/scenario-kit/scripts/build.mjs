import { cpSync, mkdirSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const distDir = resolve(root, "dist");
const cjsDir = resolve(root, "dist-cjs");
const esmDir = resolve(root, "dist-esm");

rmSync(distDir, { recursive: true, force: true });
rmSync(cjsDir, { recursive: true, force: true });
rmSync(esmDir, { recursive: true, force: true });

execSync("tsc --project ./tsconfig.build.cjs.json", { cwd: root, stdio: "inherit" });
execSync("tsc --project ./tsconfig.build.esm.json", { cwd: root, stdio: "inherit" });
execSync("tsc --project ./tsconfig.build.dts.json", { cwd: root, stdio: "inherit" });

mkdirSync(distDir, { recursive: true });
cpSync(resolve(cjsDir, "index.js"), resolve(distDir, "index.cjs"));
cpSync(resolve(cjsDir, "index.js.map"), resolve(distDir, "index.cjs.map"));
cpSync(resolve(esmDir, "index.js"), resolve(distDir, "index.mjs"));
cpSync(resolve(esmDir, "index.js.map"), resolve(distDir, "index.mjs.map"));

rmSync(cjsDir, { recursive: true, force: true });
rmSync(esmDir, { recursive: true, force: true });
