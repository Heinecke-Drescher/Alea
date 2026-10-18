import { describe, expect, it } from "vitest";
import { cellDistance } from "./measurement";

describe("cellDistance", () => {
  it.each([
    ["same cell", { x: 2, y: 3 }, { x: 2, y: 3 }, 0],
    ["horizontal", { x: 0, y: 0 }, { x: 5, y: 0 }, 5],
    ["vertical", { x: 0, y: 0 }, { x: 0, y: 4 }, 4],
    ["diagonal", { x: 0, y: 0 }, { x: 3, y: 3 }, 3],
    ["mixed direction", { x: 0, y: 0 }, { x: 5, y: 2 }, 5],
    ["negative coordinates", { x: -4, y: -3 }, { x: 2, y: 1 }, 6],
  ])("counts cells for %s in both directions", (_, from, to, expected) => {
    expect(cellDistance({ from, to })).toBe(expected);
    expect(cellDistance({ from: to, to: from })).toBe(expected);
  });
});
