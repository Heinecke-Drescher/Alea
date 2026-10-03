import { useComputedColorScheme, useMantineTheme } from "@mantine/core";
import { Rect } from "react-konva";
import { mapRect } from "../room/grid";
import { useMapBounds } from "../room/useMapBounds";

// Covers the background image, which only shows around the map.
export function MapFill() {
  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme("light");
  const bounds = useMapBounds();
  const fill = colorScheme === "dark" ? theme.colors.dark[7] : theme.white;
  return <Rect {...mapRect(bounds)} fill={fill} />;
}
