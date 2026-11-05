import {
  useComputedColorScheme,
  useMantineTheme,
  type MantineTheme,
} from "@mantine/core";
import { mapFillColor } from "../map/mapColors";

export const HIGHLIGHT_OPACITY = 0.4;

// Outlines of selected items, in screen pixels so they look the same at every zoom. They touch
// their item, because a gap shows every fraction of a pixel the item is drawn off by.
export const OUTLINE_WIDTH = 3;
export const OUTLINE_EDGE_WIDTH = 1;
export const OUTLINE_OUTSIDE = OUTLINE_WIDTH + OUTLINE_EDGE_WIDTH;

export function highlightColor(theme: MantineTheme) {
  return theme.colors.blue[6];
}

// The edge in the map's color keeps outlines visible on map images and blue highlights.
export function useOutlineColors() {
  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme("light");
  return {
    color: highlightColor(theme),
    edge: mapFillColor(theme, colorScheme),
  };
}
