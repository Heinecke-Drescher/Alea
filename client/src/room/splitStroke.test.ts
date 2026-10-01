import { describe, expect, it } from "vitest";
import { splitStroke } from "./splitStroke";

const AREA = { x: 10, y: 10, width: 20, height: 20 };

describe("splitStroke", () => {
  it("keeps a stroke completely inside the area in one piece", () => {
    expect(splitStroke([12, 12, 20, 20, 28, 12], AREA)).toEqual({
      inside: [[12, 12, 20, 20, 28, 12]],
      outside: [],
    });
  });

  it("keeps a stroke completely outside the area in one piece", () => {
    expect(splitStroke([0, 0, 50, 0, 50, 50], AREA)).toEqual({
      inside: [],
      outside: [[0, 0, 50, 0, 50, 50]],
    });
  });

  it("cuts a stroke at both edges it crosses", () => {
    expect(splitStroke([0, 20, 40, 20], AREA)).toEqual({
      inside: [[10, 20, 30, 20]],
      outside: [
        [0, 20, 10, 20],
        [30, 20, 40, 20],
      ],
    });
  });

  it("returns every piece of a stroke that leaves and comes back", () => {
    const { inside, outside } = splitStroke(
      [15, 15, 15, 40, 25, 40, 25, 15],
      AREA,
    );
    expect(inside).toEqual([
      [15, 15, 15, 30],
      [25, 30, 25, 15],
    ]);
    expect(outside).toEqual([[15, 30, 15, 40, 25, 40, 25, 30]]);
  });

  it("does not create an empty piece for a stroke starting on an edge", () => {
    expect(splitStroke([10, 20, 0, 20], AREA)).toEqual({
      inside: [],
      outside: [[10, 20, 0, 20]],
    });
  });

  it("cuts diagonal segments at the right place", () => {
    expect(splitStroke([0, 0, 20, 20], AREA)).toEqual({
      inside: [[10, 10, 20, 20]],
      outside: [[0, 0, 10, 10]],
    });
  });

  it("fails for a stroke without two points", () => {
    expect(() => splitStroke([1, 2], AREA)).toThrow();
    expect(() => splitStroke([1, 2, 3], AREA)).toThrow();
  });
});
