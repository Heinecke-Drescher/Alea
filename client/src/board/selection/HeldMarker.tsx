import { rgba, useMantineTheme } from "@mantine/core";
import type { Vector2d } from "konva/lib/types";
import { Circle, Group } from "react-konva";
import { useStageZoom } from "../useStageZoom";

const RADIUS = 18;

// Shows a finger held still that it may now draw an area.
export function HeldMarker({ point }: { point: Vector2d }) {
  const theme = useMantineTheme();
  const { groupRef, zoom } = useStageZoom();
  return (
    <Group ref={groupRef} listening={false} x={point.x} y={point.y}>
      <Circle
        radius={RADIUS / zoom}
        stroke={theme.colors.blue[6]}
        strokeWidth={2}
        strokeScaleEnabled={false}
        fill={rgba(theme.colors.blue[6], 0.2)}
      />
    </Group>
  );
}
