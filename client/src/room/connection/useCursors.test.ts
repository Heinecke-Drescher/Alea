import { describe, expect, it } from "vitest";
import { toCursor } from "./useCursors";

describe("toCursor", () => {
  it("reads a player's name and cursor position", () => {
    expect(
      toCursor(7, { name: "Mira", color: "teal", cursor: { x: 10, y: 20 } }),
    ).toEqual({
      clientId: 7,
      name: "Mira",
      color: "teal",
      x: 10,
      y: 20,
    });
  });

  it("ignores players without a cursor on the map", () => {
    expect(
      toCursor(7, { name: "Mira", color: "teal", cursor: null }),
    ).toBeNull();
    expect(toCursor(7, { name: "Mira" })).toBeNull();
    expect(toCursor(7, {})).toBeNull();
  });

  it("ignores malformed states", () => {
    expect(toCursor(7, null)).toBeNull();
    expect(toCursor(7, { name: 42, cursor: { x: 1, y: 2 } })).toBeNull();
    expect(toCursor(7, { name: "Mira", cursor: { x: "1", y: 2 } })).toBeNull();
    expect(toCursor(7, { name: "Mira", cursor: { x: NaN, y: 2 } })).toBeNull();
    expect(
      toCursor(7, { name: "Mira", color: "#ff0000", cursor: { x: 1, y: 2 } }),
    ).toBeNull();
  });
});
