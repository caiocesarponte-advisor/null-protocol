const base = require("../../jest.config.base.cjs");

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  rootDir: ".",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@null-protocol/engine$": "<rootDir>/../../packages/engine/src/index.ts",
    "^@null-protocol/scenario-kit$": "<rootDir>/../../packages/scenario-kit/src/index.ts"
  }
};
