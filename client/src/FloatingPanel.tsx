import { Paper, type PaperProps } from "@mantine/core";
import type { ComponentProps } from "react";

// Everything floating keeps this distance to the edges of the map and to each other.
export const FLOATING_GAP = 12;
export const FLOATING_PADDING = 4;
// Mantine's ActionIcon of size "lg"; other buttons in a floating bar match it.
export const FLOATING_BUTTON_HEIGHT = 34;
const BORDER = 1;
// What a floating bar of one row takes from the edge of the map, with the same gap on both sides.
export const FLOATING_BAR_SPACE =
  FLOATING_GAP +
  FLOATING_BUTTON_HEIGHT +
  2 * (FLOATING_PADDING + BORDER) +
  FLOATING_GAP;

// One look for everything that floats over the map; menus and dialogs above it have a stronger
// shadow, so a stronger shadow always means lying higher.
export function FloatingPanel(props: PaperProps & ComponentProps<"div">) {
  return <Paper withBorder shadow="sm" radius="md" {...props} />;
}
