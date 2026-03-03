import scenario from "../../web/src/demo/scenario.json";
import { createSessionStore } from "../src/store";

describe("session store snapshotting", () => {
  beforeEach(() => {
    process.env.NULL_SERVER_SNAPSHOT_INTERVAL = "2";
  });

  afterEach(() => {
    delete process.env.NULL_SERVER_SNAPSHOT_INTERVAL;
  });

  it("creates snapshots at configured intervals and reconstructs state from latest snapshot", () => {
    const store = createSessionStore();
    const created = store.createSession(scenario);

    store.applyAction(created.sessionId, { type: "gainAccessToken", payload: { tokenLabel: "alpha" } });
    store.applyAction(created.sessionId, { type: "raiseAlert", payload: { nextLevel: 1 } });
    store.applyAction(created.sessionId, { type: "advancePhase", payload: {} });

    const session = store.getSession(created.sessionId);
    expect(session?.snapshots).toHaveLength(1);
    expect(session?.snapshots[0]?.eventIndex).toBe(1);

    const reconstructed = store.getSnapshotState(created.sessionId, 2);
    const exported = store.exportSession(created.sessionId);
    expect(reconstructed).toEqual(exported.finalState);
  });
});
