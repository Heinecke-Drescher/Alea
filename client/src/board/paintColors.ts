export const PAINT_COLORS = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "grape",
  "gray",
] as const;

export type PaintColor = (typeof PAINT_COLORS)[number];
