/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "tsx", "js"],
  moduleNameMapper: {
    "^@null-protocol/([^/]+)$": "<rootDir>/../../packages/$1/src"
  },
  testMatch: ["**/__tests__/**/*.test.ts"],
  collectCoverageFrom: ["src/**/*.{ts,tsx}"],
  coveragePathIgnorePatterns: ["/node_modules/", "/dist/"]
};
