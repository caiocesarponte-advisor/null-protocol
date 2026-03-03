import { hashCanonicalJson } from "../src";

describe("hashCanonicalJson", () => {
  it("returns same hash for same scenario object", () => {
    const scenario = {
      schemaVersion: "1",
      metadata: { id: "hash-1", title: "Hash", difficulty: "easy" },
      initialState: { score: 0 },
      actions: [],
      transitions: []
    };

    expect(hashCanonicalJson(scenario)).toBe(hashCanonicalJson(scenario));
  });

  it("returns same hash for equivalent key-order variations", () => {
    const first = {
      schemaVersion: "1",
      metadata: { id: "hash-1", title: "Hash", difficulty: "easy" },
      initialState: { score: 0, nested: { b: 2, a: 1 } },
      actions: [],
      transitions: []
    };

    const second = {
      transitions: [],
      actions: [],
      initialState: { nested: { a: 1, b: 2 }, score: 0 },
      metadata: { difficulty: "easy", title: "Hash", id: "hash-1" },
      schemaVersion: "1"
    };

    expect(hashCanonicalJson(first)).toBe(hashCanonicalJson(second));
  });

  it("returns different hashes when scenario content changes", () => {
    const base = {
      schemaVersion: "1",
      metadata: { id: "hash-1", title: "Hash", difficulty: "easy" },
      initialState: { score: 0 },
      actions: [],
      transitions: []
    };

    const changed = {
      ...base,
      initialState: { score: 1 }
    };

    expect(hashCanonicalJson(base)).not.toBe(hashCanonicalJson(changed));
  });
});
