import { describe, expect, it } from "vitest";
import { RIM_EDGE_WIDTH, RIM_WIDTH, rimmedImageBox } from "./tokenRim";

describe("rimmedImageBox", () => {
  it("ends the round image in the middle of the rim", () => {
    const box = rimmedImageBox(100);
    const inset = RIM_EDGE_WIDTH + RIM_WIDTH / 2;
    expect(box).toEqual({
      x: inset,
      y: inset,
      width: 100 - 2 * inset,
      height: 100 - 2 * inset,
      cornerRadius: 50 - inset,
    });
  });
});
