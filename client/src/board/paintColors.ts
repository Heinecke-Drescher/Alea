import type { MantineTheme } from "@mantine/core";

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

export function paintColorValue(theme: MantineTheme, color: PaintColor) {
  return theme.colors[color][6];
}
