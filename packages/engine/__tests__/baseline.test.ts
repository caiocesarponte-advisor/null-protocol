import { createenginePlaceholder } from "../src/index";

describe("engine scaffold", () => {
  it("returns package placeholder metadata", () => {
    expect(createenginePlaceholder().name).toBe("@null-protocol/engine");
  });
});
