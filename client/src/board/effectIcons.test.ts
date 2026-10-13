import { describe, expect, it } from "vitest";
import { STATUS_EFFECTS } from "../room/effects";
import { effectImageUrl } from "./effectIcons";

describe("effectImageUrl", () => {
  it("colors every effect icon and enlarges it", () => {
    for (const effect of STATUS_EFFECTS) {
      const svg = decodeURIComponent(
        effectImageUrl(effect, "#ffffff").split(",")[1] ?? "",
      );
      expect(svg).toContain('stroke="#ffffff"');
      expect(svg).toContain('width="96"');
      expect(svg).toContain('height="96"');
      expect(svg).not.toContain("currentColor");
    }
  });
});
