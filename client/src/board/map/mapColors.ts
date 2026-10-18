import type { MantineTheme } from "@mantine/core";

export function mapFillColor(
  theme: MantineTheme,
  colorScheme: "light" | "dark",
) {
  return colorScheme === "dark" ? theme.colors.dark[7] : theme.white;
}
