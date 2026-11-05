import { rgba, useComputedColorScheme, useMantineTheme } from "@mantine/core";
import { Rect } from "react-konva";
import { mapFillColor } from "../map/mapColors";
import { highlightColor } from "./highlight";

interface DashedFrameProps {
  width: number;
  height: number;
}

export function DashedFrame(size: DashedFrameProps) {
  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme("light");
  const color = highlightColor(theme);

  return (
    <>
      {/* A line in the map's color fills the gaps between the dashes, so the frame shows on map images and blue highlights too. */}
      <Rect
        {...size}
        stroke={mapFillColor(theme, colorScheme)}
        strokeWidth={4}
        strokeScaleEnabled={false}
        listening={false}
      />
      <Rect
        {...size}
        fill={rgba(color, 0.06)}
        stroke={color}
        strokeWidth={2}
        dash={[6, 4]}
        strokeScaleEnabled={false}
      />
    </>
  );
}
