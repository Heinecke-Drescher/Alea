import { describe, expect, it } from "vitest";
import { hoverCardPlacement } from "./hoverCardPlacement";

const view = { width: 1000, height: 800 };
const cardWidth = 200;

describe("hoverCardPlacement", () => {
  it("puts the card right of a token in the upper left, level with its top", () => {
    const token = { x: 100, y: 100, width: 50, height: 50 };
    expect(hoverCardPlacement(token, view, cardWidth)).toEqual({
      left: 162,
      top: 100,
      maxHeight: 688,
    });
  });

  it("puts the card left of a token near the right edge", () => {
    const token = { x: 850, y: 100, width: 50, height: 50 };
    expect(hoverCardPlacement(token, view, cardWidth).left).toBe(638);
  });

  it("puts the card level with the bottom of a token in the lower half", () => {
    const token = { x: 100, y: 600, width: 50, height: 50 };
    expect(hoverCardPlacement(token, view, cardWidth)).toEqual({
      left: 162,
      bottom: 150,
      maxHeight: 638,
    });
  });

  it("keeps the card inside the view for a token partly outside it", () => {
    const token = { x: -100, y: -30, width: 50, height: 50 };
    const placement = hoverCardPlacement(token, view, cardWidth);
    expect(placement.left).toBe(12);
    expect(placement.top).toBe(12);
  });

  it("keeps the card inside the view when neither side has room", () => {
    const narrow = { width: 300, height: 800 };
    const token = { x: 100, y: 100, width: 100, height: 100 };
    expect(hoverCardPlacement(token, narrow, cardWidth).left).toBe(12);
  });
});
