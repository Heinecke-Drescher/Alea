import { isLightColor, type MantineTheme } from "@mantine/core";
import type { rollColor } from "../room/rolls";

export function dieColors(
  theme: MantineTheme,
  color: ReturnType<typeof rollColor>,
) {
  const fill = theme.colors[color][6];
  return {
    fill,
    hoverFill: theme.colors[color][7],
    text: isLightColor(fill, theme.luminanceThreshold)
      ? theme.black
      : theme.white,
  };
}
