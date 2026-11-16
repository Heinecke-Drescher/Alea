import { describe, expect, it } from "vitest";
import { isPlayerPresent, toPlayerId } from "./playerId";

describe("toPlayerId", () => {
  it("reads the player id of a state", () => {
    expect(toPlayerId(7, { playerId: "p1", name: "Ann" })).toBe("p1");
  });

  it("ignores states without a player id", () => {
    expect(toPlayerId(7, null)).toBeNull();
    expect(toPlayerId(7, { name: "Ann" })).toBeNull();
    expect(toPlayerId(7, { playerId: 3 })).toBeNull();
  });
});

describe("isPlayerPresent", () => {
  const awareness = (states: [number, Record<string, unknown>][]) => ({
    clientID: 1,
    getStates: () => new Map(states),
  });

  it("finds a player in another tab or browser", () => {
    expect(isPlayerPresent(awareness([[2, { playerId: "dm" }]]), "dm")).toBe(
      true,
    );
  });

  it("does not count the own tab", () => {
    expect(isPlayerPresent(awareness([[1, { playerId: "dm" }]]), "dm")).toBe(
      false,
    );
  });

  it("ignores other players and broken states", () => {
    const states: [number, Record<string, unknown>][] = [
      [2, { playerId: "other" }],
      [3, { playerId: 5 }],
      [4, {}],
    ];
    expect(isPlayerPresent(awareness(states), "dm")).toBe(false);
  });
});
