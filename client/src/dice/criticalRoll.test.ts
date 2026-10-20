import { describe, expect, it } from "vitest";
import { isFresh, isNatural20 } from "./criticalRoll";

describe("isNatural20", () => {
  it("finds only a 20 on the d20", () => {
    expect(isNatural20(20, 20)).toBe(true);
    expect(isNatural20(20, 1)).toBe(false);
    expect(isNatural20(100, 20)).toBe(false);
  });
});

describe("isFresh", () => {
  it("accepts rolls of the last ten seconds and not older ones", () => {
    expect(isFresh(1_000, 11_000)).toBe(true);
    expect(isFresh(1_000, 11_001)).toBe(false);
  });
});
