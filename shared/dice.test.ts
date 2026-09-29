import { afterEach, describe, expect, it, vi } from "vitest";
import { DIE_SIDES, rollDie } from "./dice";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("rollDie", () => {
  it.each(DIE_SIDES)("rolls 1 to %d", (sides) => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0.9999);
    expect(rollDie(sides)).toBe(1);
    expect(rollDie(sides)).toBe(sides);
  });
});
