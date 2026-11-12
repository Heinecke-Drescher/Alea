import { describe, expect, it } from "vitest";
import { PLAYER_NAMES, RUDE_WORDS, randomPlayerName } from "./randomPlayerName";

describe("randomPlayerName", () => {
  it("offers every allowed combination once", () => {
    expect(PLAYER_NAMES).toHaveLength(16 * 32 + 16 * 16);
    expect(new Set(PLAYER_NAMES).size).toBe(PLAYER_NAMES.length);
  });

  it("makes every name rude in at least one word", () => {
    for (const name of PLAYER_NAMES) {
      expect(name.split(" ").some((word) => RUDE_WORDS.has(word))).toBe(true);
    }
    expect(PLAYER_NAMES).not.toContain("Supreme Snake");
  });

  it("picks one of the allowed names", () => {
    expect(PLAYER_NAMES).toContain(randomPlayerName());
  });
});
