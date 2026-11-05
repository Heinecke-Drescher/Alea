import { DEFAULT_THEME } from "@mantine/core";
import { describe, expect, it } from "vitest";
import { PLACEHOLDER_ICONS, placeholderSvg } from "./placeholderImage";

describe("placeholderSvg", () => {
  it("writes a label on the player color", () => {
    const svg = placeholderSvg({ label: "G1" }, "blue", DEFAULT_THEME);
    expect(svg).toContain(`fill="${DEFAULT_THEME.colors.blue[6]}"`);
    expect(svg).toContain(`fill="${DEFAULT_THEME.white}">G1</text>`);
  });

  it("writes dark ink on light colors", () => {
    const svg = placeholderSvg({ label: "G" }, "yellow", DEFAULT_THEME);
    expect(svg).toContain(`fill="${DEFAULT_THEME.black}">G</text>`);
  });

  it("escapes the label", () => {
    const svg = placeholderSvg({ label: "<&" }, "blue", DEFAULT_THEME);
    expect(svg).toContain(">&lt;&amp;</text>");
  });

  it("shrinks longer labels", () => {
    const sizes = ["G", "G1", "G12"].map((label) => {
      const svg = placeholderSvg({ label }, "blue", DEFAULT_THEME);
      const size = /font-size="(\d+)"/.exec(svg)?.[1];
      if (!size) throw new Error(`Expected a font size for ${label}`);
      return Number(size);
    });
    expect(sizes).toEqual([72, 60, 46]);
  });

  it("counts visible characters", () => {
    const svg = placeholderSvg({ label: "👍🏽" }, "blue", DEFAULT_THEME);
    expect(svg).toContain('font-size="72"');
  });

  it("draws only the player color without a label", () => {
    const svg = placeholderSvg({ label: null }, "blue", DEFAULT_THEME);
    expect(svg).toContain(`fill="${DEFAULT_THEME.colors.blue[6]}"/></svg>`);
    expect(svg).not.toContain("<text");
  });

  it("rejects empty, blank and too long labels", () => {
    for (const label of ["", " ", "G123"]) {
      expect(() => placeholderSvg({ label }, "blue", DEFAULT_THEME)).toThrow(
        "must have 1 to 3 characters",
      );
    }
  });

  it("draws every icon in the ink color", () => {
    for (const icon of PLACEHOLDER_ICONS) {
      const svg = placeholderSvg({ icon, number: null }, "blue", DEFAULT_THEME);
      expect(svg).toContain(`stroke="${DEFAULT_THEME.white}"`);
      expect(svg).toContain('width="80"');
      expect(svg).not.toContain("currentColor");
      expect(svg).not.toContain("<circle");
    }
  });

  it("adds a numbered badge and shrinks the icon for it", () => {
    const svg = placeholderSvg(
      { icon: "skull", number: 12 },
      "blue",
      DEFAULT_THEME,
    );
    expect(svg).toContain('width="64"');
    expect(svg).toContain(
      `<circle cx="92" cy="92" r="22" fill="${DEFAULT_THEME.colors.blue[6]}" stroke="${DEFAULT_THEME.white}"`,
    );
    expect(svg).toContain(`fill="${DEFAULT_THEME.white}">12</text>`);
  });

  it("rejects numbers that do not fit the badge", () => {
    for (const number of [0, 1.5, 100]) {
      expect(() =>
        placeholderSvg({ icon: "skull", number }, "blue", DEFAULT_THEME),
      ).toThrow("must be from 1 to 99");
    }
  });
});
