import { execSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

execSync("tsup --config ./tsup.config.ts", {
  cwd: root,
  stdio: "inherit"
});
