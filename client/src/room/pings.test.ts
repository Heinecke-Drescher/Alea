import { describe, expect, it } from "vitest";
import { pingKey, toPing } from "./pings";

describe("toPing", () => {
  const state = { name: "Ann", color: "blue", ping: { x: 10, y: -20, at: 5 } };

  it("reads a player's ping", () => {
    expect(toPing(7, state)).toEqual({
      clientId: 7,
      color: "blue",
      x: 10,
      y: -20,
      at: 5,
    });
  });

  it("ignores players without a ping", () => {
    expect(toPing(7, { name: "Ann", color: "blue" })).toBeNull();
    expect(toPing(7, { ...state, ping: null })).toBeNull();
  });

  it("ignores malformed states", () => {
    expect(toPing(7, null)).toBeNull();
    expect(toPing(7, { ...state, color: "plaid" })).toBeNull();
    expect(toPing(7, { ...state, ping: { x: "10", y: 0, at: 5 } })).toBeNull();
    expect(toPing(7, { ...state, ping: { x: 10, y: NaN, at: 5 } })).toBeNull();
    expect(toPing(7, { ...state, ping: { x: 10, y: 0 } })).toBeNull();
  });
});

describe("pingKey", () => {
  it("tells pings of different players and times apart", () => {
    const ping = { clientId: 7, color: "blue" as const, x: 0, y: 0, at: 5 };
    expect(pingKey(ping)).not.toBe(pingKey({ ...ping, at: 6 }));
    expect(pingKey(ping)).not.toBe(pingKey({ ...ping, clientId: 8 }));
  });
});
