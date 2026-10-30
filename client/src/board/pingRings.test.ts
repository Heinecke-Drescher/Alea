import { describe, expect, it } from "vitest";
import { PING_SECONDS, pingRings } from "./pingRings";

describe("pingRings", () => {
  it("starts with one ring and adds the others one after another", () => {
    expect(pingRings(0.1)).toHaveLength(1);
    expect(pingRings(0.3)).toHaveLength(2);
    expect(pingRings(0.5)).toHaveLength(3);
  });

  it("grows each ring and fades it out", () => {
    const [early] = pingRings(0.1);
    const [late] = pingRings(0.7);
    expect(late!.size).toBeGreaterThan(early!.size);
    expect(late!.opacity).toBeLessThan(early!.opacity);
    for (const ring of pingRings(0.5)) {
      expect(ring.size).toBeGreaterThan(0);
      expect(ring.size).toBeLessThanOrEqual(1);
    }
  });

  it("is over after the ping time", () => {
    expect(pingRings(PING_SECONDS)).toEqual([]);
    expect(pingRings(PING_SECONDS - 0.05)).toHaveLength(1);
  });
});
