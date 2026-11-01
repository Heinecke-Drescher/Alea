import { describe, expect, it } from "vitest";
import { mapImageNode, placeOfNode } from "./mapImageNode";

describe("mapImageNode", () => {
  it("centers an upright image on its place", () => {
    expect(
      mapImageNode({ x: 100, y: 50, width: 400, height: 200, rotation: 0 }),
    ).toEqual({
      x: 300,
      y: 150,
      width: 400,
      height: 200,
      offsetX: 200,
      offsetY: 100,
      rotation: 0,
    });
  });

  it("swaps width and height of a sideways image", () => {
    expect(
      mapImageNode({ x: 100, y: 50, width: 400, height: 200, rotation: 90 }),
    ).toMatchObject({ x: 300, y: 150, width: 200, height: 400 });
  });

  it("gives back the place the node was made from", () => {
    for (const rotation of [0, 90, 180, 270] as const) {
      const place = { x: -20.5, y: 40, width: 600, height: 300, rotation };
      const { x, y, width, height } = mapImageNode(place);
      expect(placeOfNode({ x, y, width, height }, rotation)).toEqual(place);
    }
  });
});
