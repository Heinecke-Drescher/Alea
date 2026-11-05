import { rgba, useMantineTheme } from "@mantine/core";
import { Circle, Group } from "react-konva";
import {
  highlightColor,
  OUTLINE_EDGE_WIDTH,
  OUTLINE_WIDTH,
  useOutlineColors,
} from "../selection/highlight";
import { useStageZoom } from "../useStageZoom";

export function SelectionRing({ size }: { size: number }) {
  const { color, edge } = useOutlineColors();
  const { groupRef, zoom } = useStageZoom();
  const ring = {
    x: size / 2,
    y: size / 2,
    radius: size / 2 + OUTLINE_WIDTH / 2 / zoom,
    strokeScaleEnabled: false,
  };

  // The inner half of the edge lies under the token.
  return (
    <Group ref={groupRef} listening={false}>
      <Circle
        {...ring}
        stroke={edge}
        strokeWidth={OUTLINE_WIDTH + 2 * OUTLINE_EDGE_WIDTH}
      />
      <Circle {...ring} stroke={color} strokeWidth={OUTLINE_WIDTH} />
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
