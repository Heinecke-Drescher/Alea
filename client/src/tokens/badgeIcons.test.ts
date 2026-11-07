import { describe, expect, it } from "vitest";
import { STATUS_EFFECTS } from "../room/effects";
import { MARK_ICONS, NEW_MARK } from "../room/marks";
import { badgeImageUrl, fitBadges, tokenBadges } from "./badgeIcons";

describe("badgeImageUrl", () => {
  it("colors every effect and mark icon and enlarges it", () => {
    for (const icon of [...STATUS_EFFECTS, ...MARK_ICONS]) {
      const [, data] = badgeImageUrl(icon, "#ffffff").split(",");
      if (!data) throw new Error(`Expected image data for ${icon}`);
      const svg = decodeURIComponent(data);
      expect(svg).toContain('stroke="#ffffff"');
      expect(svg).toContain('width="96"');
      expect(svg).toContain('height="96"');
      expect(svg).not.toContain("currentColor");
    }
  });
});

describe("tokenBadges", () => {
  it("lists the effects before the marks", () => {
    const badges = tokenBadges(
      ["dead", "unconscious"],
      [
        { ...NEW_MARK, text: "Cursed" },
        { ...NEW_MARK, text: "Blessed" },
      ],
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

  it("shows a mark with its own icon and color", () => {
    expect(
      tokenBadges([], [{ text: "Blessed", icon: "star", color: "yellow" }]),
    ).toEqual([
      { key: "mark-0", icon: "star", label: "Blessed", color: "yellow" },
    ]);
  });

  it("names a mark without text after its icon", () => {
    expect(
      tokenBadges(
        [],
        [
          { ...NEW_MARK, text: "" },
          { ...NEW_MARK, icon: "star" },
        ],
      ),
    ).toEqual([
      { key: "mark-0", icon: "flag", label: "Flag", color: "orange" },
      { key: "mark-1", icon: "star", label: "Star", color: "orange" },
    ]);
  });

  it("is empty without effects and marks", () => {
    expect(tokenBadges([], [])).toEqual([]);
  });
});

describe("fitBadges", () => {
  const badges = tokenBadges(
    ["dead"],
    [
      { ...NEW_MARK, text: "A" },
      { ...NEW_MARK, text: "B" },
      { ...NEW_MARK, text: "C" },
    ],
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
