import { describe, expect, it } from "vitest";
import { fitsBesideToolbar } from "./panelColumn";

describe("fitsBesideToolbar", () => {
  const axisShift = 126;

  it("lets the column start beside a toolbar that ends left of its tab", () => {
    expect(fitsBesideToolbar(1010, 553, axisShift)).toBe(true);
    expect(fitsBesideToolbar(895, 435, axisShift)).toBe(true);
  });

  it("keeps the column below a toolbar that would reach its tab", () => {
    expect(fitsBesideToolbar(1000, 553, axisShift)).toBe(false);
    expect(fitsBesideToolbar(885, 435, axisShift)).toBe(false);
  });
});
