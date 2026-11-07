import { describe, expect, it } from "vitest";
import { otherPlayers, toPresentPlayer, uniquePlayers } from "./usePlayers";

const mira = { playerId: "p1", name: "Mira", color: "teal" } as const;
const bo = { playerId: "p2", name: "Bo", color: "red" } as const;

describe("toPresentPlayer", () => {
  it("reads a player's id, name and color", () => {
    expect(toPresentPlayer(7, { ...mira, cursor: null })).toEqual(mira);
  });

  it("keeps a player without a name", () => {
    expect(toPresentPlayer(7, { ...mira, name: "" })).toEqual({
      ...mira,
      name: "",
    });
  });

  it("ignores malformed states", () => {
    expect(toPresentPlayer(7, null)).toBeNull();
    expect(toPresentPlayer(7, {})).toBeNull();
    expect(toPresentPlayer(7, { ...mira, playerId: "" })).toBeNull();
    expect(toPresentPlayer(7, { ...mira, playerId: 3 })).toBeNull();
    expect(toPresentPlayer(7, { ...mira, name: 42 })).toBeNull();
    expect(toPresentPlayer(7, { ...mira, color: "black" })).toBeNull();
  });
});

describe("uniquePlayers", () => {
  it("lists a player with several tabs once", () => {
    expect(uniquePlayers([mira, bo, { ...mira, name: "Mira 2" }])).toEqual([
      mira,
      bo,
    ]);
  });
});

describe("otherPlayers", () => {
  it("leaves out the own player and sorts by name", () => {
    expect(otherPlayers([mira, bo, { ...bo, playerId: "me" }], "me")).toEqual([
      bo,
      mira,
    ]);
  });
});
