import { DEFAULT_THEME } from "@mantine/core";
import { describe, expect, it } from "vitest";
import { MAX_PLACEHOLDERS, placeholderNames } from "./addPlaceholders";
import { placeholderSvg } from "./placeholderImage";

describe("placeholderNames", () => {
  it("numbers several placeholders and labels them with the initial", () => {
    expect(placeholderNames("goblin", 3)).toEqual([
      { name: "goblin 1", label: "G1", number: 1 },
      { name: "goblin 2", label: "G2", number: 2 },
      { name: "goblin 3", label: "G3", number: 3 },
    ]);
  });

  it("leaves a single placeholder without a number", () => {
    expect(placeholderNames("Ogre", 1)).toEqual([
      { name: "Ogre", label: "O", number: null },
    ]);
  });

  it("keeps a whole emoji as the initial", () => {
    expect(placeholderNames("👍🏽 Fan", 2)[1]).toMatchObject({ label: "👍🏽2" });
  });

  it("keeps letters that grow when upper-cased", () => {
    expect(placeholderNames("ßeast", 1)).toEqual([
      { name: "ßeast", label: "ß", number: null },
    ]);
  });

  it("fits the label of the last placeholder", () => {
    const last = placeholderNames("Goblin", MAX_PLACEHOLDERS).at(-1);
    if (!last) throw new Error("Expected placeholders");
    expect(last.label).toBe(`G${MAX_PLACEHOLDERS}`);
    expect(() =>
      placeholderSvg({ label: last.label }, "blue", DEFAULT_THEME),
    ).not.toThrow();
  });

  it("rejects invalid counts and names", () => {
    for (const count of [0, 1.5, MAX_PLACEHOLDERS + 1]) {
      expect(() => placeholderNames("Goblin", count)).toThrow(
        "Invalid placeholder count",
      );
    }
    expect(() => placeholderNames("  ", 1)).toThrow("needs a name");
  });
});
