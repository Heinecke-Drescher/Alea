import { rgba, type MantineTheme } from "@mantine/core";
import type { CSSProperties } from "react";

// A light rim with a fine dark edge, like the rim of a coin, so a token stands out on light and
// dark maps alike.
export const RIM_WIDTH = 2;
export const RIM_EDGE_WIDTH = 1;
const EDGE_ALPHA = 0.65;
// The image ends in the middle of the opaque rim, so neither its smoothed outline nor its colors
// show through the translucent edge.
const IMAGE_INSET = RIM_EDGE_WIDTH + RIM_WIDTH / 2;

export function rimColors(theme: MantineTheme) {
  return { rim: theme.colors.gray[1], edge: rgba(theme.black, EDGE_ALPHA) };
}

export function rimmedImageBox(size: number) {
  const width = size - 2 * IMAGE_INSET;
  return {
    x: IMAGE_INSET,
    y: IMAGE_INSET,
    width,
    height: width,
    cornerRadius: width / 2,
  };
}

// The same rim on a round image in the page: the border is the edge, and the outline, drawn over
// the picture, is the rim just inside it.
export function rimStyle(theme: MantineTheme): CSSProperties {
  const { rim, edge } = rimColors(theme);
  return {
    border: `${RIM_EDGE_WIDTH}px solid ${edge}`,
    outline: `${RIM_WIDTH}px solid ${rim}`,
    outlineOffset: -(RIM_EDGE_WIDTH + RIM_WIDTH),
  };
}
