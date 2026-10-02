import { describe, expect, it } from "vitest";
import {
  defaultPlayerColor,
  isPlayerColor,
  PLAYER_COLORS,
} from "./playerColors";

describe("isPlayerColor", () => {
  it("accepts only the offered colors", () => {
    expect(PLAYER_COLORS.every(isPlayerColor)).toBe(true);
    expect(isPlayerColor("gray")).toBe(false);
    expect(isPlayerColor("#ff0000")).toBe(false);
    expect(isPlayerColor(3)).toBe(false);
  });
});

describe("defaultPlayerColor", () => {
  it("always gives the same name the same color", () => {
    expect(defaultPlayerColor("Mira")).toBe(defaultPlayerColor("Mira"));
    expect(isPlayerColor(defaultPlayerColor(""))).toBe(true);
  });

  it("spreads different names over the colors", () => {
    const names = ["Anna", "Ben", "Carla", "Dario", "Elif", "Finn", "Greta"];
    expect(new Set(names.map(defaultPlayerColor)).size).toBeGreaterThan(3);
  });
});
