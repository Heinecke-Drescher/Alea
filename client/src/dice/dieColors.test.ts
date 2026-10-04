import { DEFAULT_THEME } from "@mantine/core";
import { describe, expect, it } from "vitest";
import { dieColors } from "./dieColors";

describe("dieColors", () => {
  it("fills the die with the player color", () => {
    expect(dieColors(DEFAULT_THEME, "green")).toMatchObject({
      fill: DEFAULT_THEME.colors.green[6],
      hoverFill: DEFAULT_THEME.colors.green[7],
    });
  });

  it("writes dark numbers on light colors and light numbers on dark ones", () => {
    expect(dieColors(DEFAULT_THEME, "yellow").text).toBe(DEFAULT_THEME.black);
    expect(dieColors(DEFAULT_THEME, "green").text).toBe(DEFAULT_THEME.black);
    expect(dieColors(DEFAULT_THEME, "indigo").text).toBe(DEFAULT_THEME.white);
    expect(dieColors(DEFAULT_THEME, "red").text).toBe(DEFAULT_THEME.white);
  });
});
