import type { MantineTheme } from "@mantine/core";

export const HIGHLIGHT_OPACITY = 0.4;

export function highlightColor(theme: MantineTheme) {
  return theme.colors.blue[6];
}
