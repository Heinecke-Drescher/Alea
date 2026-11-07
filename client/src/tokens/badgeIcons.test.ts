import { describe, expect, it } from "vitest";
import { STATUS_EFFECTS } from "../room/effects";
import { badgeImageUrl, fitBadges, tokenBadges } from "./badgeIcons";

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
  it("lists the effects before the marks", () => {
    const badges = tokenBadges(
      ["dead", "unconscious"],
      [{ text: "Cursed" }, { text: "Blessed" }],
    );
    expect(badges.map((badge) => badge.key)).toEqual([
      "dead",
      "unconscious",
      "mark-0",
      "mark-1",
    ]);
    expect(badges.map((badge) => badge.label)).toEqual([
      "Dead",
      "Unconscious",
      "Cursed",
      "Blessed",
    ]);
  });

  it("names a mark without text", () => {
    expect(tokenBadges([], [{ text: "" }])).toEqual([
      { key: "mark-0", kind: "mark", label: "Marked", color: "orange" },
    ]);
  });

  it("is empty without effects and marks", () => {
    expect(tokenBadges([], [])).toEqual([]);
  });
});

describe("fitBadges", () => {
  const badges = tokenBadges(
    ["dead"],
    [{ text: "A" }, { text: "B" }, { text: "C" }],
  );

  it("shows all badges that fit", () => {
    expect(fitBadges(badges.slice(0, 3), 3)).toEqual({
      shown: badges.slice(0, 3),
      hidden: [],
    });
  });

  it("keeps the last place for the hidden ones", () => {
    expect(fitBadges(badges, 3)).toEqual({
      shown: badges.slice(0, 2),
      hidden: badges.slice(2),
    });
  });
});
