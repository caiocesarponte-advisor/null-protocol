import { createscenario_kitPlaceholder } from "../src/index";

describe("scenario-kit scaffold", () => {
  it("returns package placeholder metadata", () => {
    expect(createscenario_kitPlaceholder().name).toBe("@null-protocol/scenario-kit");
  });
});
