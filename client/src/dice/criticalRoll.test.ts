import { describe, expect, it } from "vitest";
import { criticalKind, isFresh } from "./criticalRoll";

describe("criticalKind", () => {
  it("finds a natural 20 and a natural 1 only on the d20", () => {
    expect(criticalKind(20, 20)).toBe("natural20");
    expect(criticalKind(20, 1)).toBe("natural1");
    expect(criticalKind(20, 2)).toBeNull();
    expect(criticalKind(100, 20)).toBeNull();
    expect(criticalKind(6, 1)).toBeNull();
  });
});

describe("isFresh", () => {
  it("accepts rolls of the last ten seconds and not older ones", () => {
    expect(isFresh(1_000, 11_000)).toBe(true);
    expect(isFresh(1_000, 11_001)).toBe(false);
  });
});
