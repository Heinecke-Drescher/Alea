import { afterEach, describe, expect, it, vi } from "vitest";
import { DIE_SIDES, isDieSides, rollDie } from "./dice";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("isDieSides", () => {
  it("accepts only the dice we offer", () => {
    expect(DIE_SIDES.every(isDieSides)).toBe(true);
    expect(isDieSides(7)).toBe(false);
    expect(isDieSides(Number.NaN)).toBe(false);
  });
});

describe("rollDie", () => {
  it.each(DIE_SIDES)("rolls 1 to %d", (sides) => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0.9999);
    expect(rollDie(sides)).toBe(1);
    expect(rollDie(sides)).toBe(sides);
  });
});
