import { describe, expect, it } from "vitest";
import { STATUS_EFFECTS } from "../room/effects";
import { badgeImageUrl, tokenBadges } from "./badgeIcons";

describe("badgeImageUrl", () => {
  it("colors every effect icon and enlarges it", () => {
    for (const effect of STATUS_EFFECTS) {
      const [, data] = badgeImageUrl(effect, "#ffffff").split(",");
      if (!data) throw new Error(`Expected image data for ${effect}`);
      const svg = decodeURIComponent(data);
      expect(svg).toContain('stroke="#ffffff"');
      expect(svg).toContain('width="96"');
      expect(svg).toContain('height="96"');
      expect(svg).not.toContain("currentColor");
    }
  });

  it("colors the mark icon and enlarges it", () => {
    const [, data] = badgeImageUrl("mark", "#ffffff").split(",");
    if (!data) throw new Error("Expected image data for the mark");
    const svg = decodeURIComponent(data);
    expect(svg).toContain('stroke="#ffffff"');
    expect(svg).toContain('width="96"');
    expect(svg).toContain('height="96"');
    expect(svg).not.toContain("currentColor");
  });
});

describe("tokenBadges", () => {
  it("lists the effects before the mark", () => {
    const badges = tokenBadges(["dead", "unconscious"], "Cursed");
    expect(badges.map((badge) => badge.kind)).toEqual([
      "dead",
      "unconscious",
      "mark",
    ]);
    expect(badges.map((badge) => badge.label)).toEqual([
      "Dead",
      "Unconscious",
      "Cursed",
    ]);
  });

  it("names a mark without text", () => {
    expect(tokenBadges([], "")).toEqual([
      { kind: "mark", label: "Marked", color: "orange" },
    ]);
  });

  it("is empty without effects and mark", () => {
    expect(tokenBadges([], null)).toEqual([]);
  });
});
