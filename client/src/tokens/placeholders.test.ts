import { DEFAULT_THEME } from "@mantine/core";
import { describe, expect, it } from "vitest";
import {
  MAX_PLACEHOLDERS,
  placeholderNames,
  placeholderOf,
} from "./placeholders";
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

  it("leaves a single placeholder without a name blank", () => {
    expect(placeholderNames("  ", 1)).toEqual([
      { name: "", label: null, number: null },
    ]);
  });

  it("names and labels placeholders without a name by their number", () => {
    expect(placeholderNames("", 2)).toEqual([
      { name: "1", label: "1", number: 1 },
      { name: "2", label: "2", number: 2 },
    ]);
  });

  it("trims the name", () => {
    expect(placeholderNames(" Ogre ", 2)[0]).toEqual({
      name: "Ogre 1",
      label: "O1",
      number: 1,
    });
  });

  it("rejects invalid counts", () => {
    for (const count of [0, 1.5, MAX_PLACEHOLDERS + 1]) {
      expect(() => placeholderNames("Goblin", count)).toThrow(
        "Invalid placeholder count",
      );
    }
  });
});

describe("placeholderOf", () => {
  it("labels a token with its initial and the number its name ends with", () => {
    expect(placeholderOf("goblin 2")).toEqual({ label: "G2", number: 2 });
    expect(placeholderOf("Ogre")).toEqual({ label: "O", number: null });
  });

  it("labels a token named by a number with that number", () => {
    expect(placeholderOf("3")).toEqual({ label: "3", number: 3 });
  });

  it("leaves a token without a name blank", () => {
    expect(placeholderOf(" ")).toEqual({ label: null, number: null });
  });

  it("keeps numbers too large for the label in the name only", () => {
    expect(placeholderOf("Room 101")).toEqual({ label: "R", number: null });
  });
});
