import { rgba, useComputedColorScheme, useMantineTheme } from "@mantine/core";
import { Circle, Group } from "react-konva";
import { mapFillColor } from "../map/mapColors";
import { highlightColor } from "../selection/highlight";
import { useStageZoom } from "../useStageZoom";

// In screen pixels, so the ring looks the same at every zoom. It touches the token, because a
// gap shows every fraction of a pixel the token is drawn off by when zoomed out. The inner half
// of the edge lies under the token.
const RING_WIDTH = 3;
const EDGE_WIDTH = 1;
export const RING_OUTSIDE = RING_WIDTH + EDGE_WIDTH;

export function SelectionRing({ size }: { size: number }) {
  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme("light");
  const { groupRef, zoom } = useStageZoom();
  const ring = {
    x: size / 2,
    y: size / 2,
    radius: size / 2 + RING_WIDTH / 2 / zoom,
    strokeScaleEnabled: false,
  };

  return (
    <Group ref={groupRef} listening={false}>
      <Circle
        {...ring}
        stroke={mapFillColor(theme, colorScheme)}
        strokeWidth={RING_WIDTH + 2 * EDGE_WIDTH}
      />
      <Circle
        {...ring}
        stroke={highlightColor(theme)}
        strokeWidth={RING_WIDTH}
      />
    </Group>
  );
}

// Lighter than on cells, so the token's picture stays recognizable.
const TINT_ALPHA = 0.25;

export function SelectionTint({ size }: { size: number }) {
  const theme = useMantineTheme();
  return (
    <Circle
      x={size / 2}
      y={size / 2}
      radius={size / 2}
      fill={rgba(highlightColor(theme), TINT_ALPHA)}
      listening={false}
    />
  );
}
