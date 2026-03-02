import { createuiPlaceholder } from "../src/index";

describe("ui scaffold", () => {
  it("returns package placeholder metadata", () => {
    expect(createuiPlaceholder().name).toBe("@null-protocol/ui");
  });
});
