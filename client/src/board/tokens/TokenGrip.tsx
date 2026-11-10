import { Circle, Group } from "react-konva";
import { useStageZoom } from "../useStageZoom";

// In screen pixels: the smallest touch target Material Design asks for, and the margin around the
// image that a finger may miss it by.
const MIN_GRIP_SIZE = 48;
const GRIP_MARGIN = 12;

// A selected token can be grabbed a bit beside its image, so a finger that misses it slightly moves
// the token instead of the map. Invisible: Konva hits any shape with a fill, whatever its color.
export function TokenGrip({ size }: { size: number }) {
  const { groupRef, zoom } = useStageZoom();
  const radius = Math.max(
    size / 2 + GRIP_MARGIN / zoom,
    MIN_GRIP_SIZE / 2 / zoom,
  );
  return (
    <Group ref={groupRef}>
      <Circle x={size / 2} y={size / 2} radius={radius} fill="transparent" />
    </Group>
  );
}
