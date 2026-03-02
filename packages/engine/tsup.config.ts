import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  outDir: "dist",
  dts: true,
  bundle: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outExtension({ format }) {
    return {
      js: format === "esm" ? ".mjs" : ".cjs"
    };
  }
});
