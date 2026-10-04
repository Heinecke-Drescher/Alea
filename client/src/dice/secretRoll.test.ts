import { describe, expect, it } from "vitest";
import { rollSecretly } from "./secretRoll";

describe("rollSecretly", () => {
  it("rolls within the die and gives every roll its own id", () => {
    const rolls = Array.from({ length: 50 }, () => rollSecretly(6));
    for (const roll of rolls) {
      expect(roll.sides).toBe(6);
      expect(roll.value).toBeGreaterThanOrEqual(1);
      expect(roll.value).toBeLessThanOrEqual(6);
    }
    expect(new Set(rolls.map((roll) => roll.id)).size).toBe(rolls.length);
  });
});
