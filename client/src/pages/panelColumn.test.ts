import { describe, expect, it } from "vitest";
import { fitsBesideToolbar } from "./panelColumn";

describe("fitsBesideToolbar", () => {
  const axisShift = 96;

  it("lets the column start beside a toolbar that ends left of its tab", () => {
    expect(fitsBesideToolbar(960, 553, axisShift)).toBe(true);
    expect(fitsBesideToolbar(840, 435, axisShift)).toBe(true);
  });

  it("keeps the column below a toolbar that would reach its tab", () => {
    expect(fitsBesideToolbar(930, 553, axisShift)).toBe(false);
    expect(fitsBesideToolbar(800, 435, axisShift)).toBe(false);
  });
});
