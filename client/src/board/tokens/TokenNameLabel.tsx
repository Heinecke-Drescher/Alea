import { useMantineTheme } from "@mantine/core";
import { Group } from "react-konva";
import { highlightColor } from "../selection/highlight";
import { MapLabel } from "../MapLabel";
import { useStageZoom } from "../useStageZoom";
import { RING_OUTSIDE } from "./SelectionRing";

// In screen pixels, clear of the selection ring.
const GAP = RING_OUTSIDE + 3;

interface TokenNameLabelProps {
  name: string;
  // The token's width in map pixels.
  size: number;
}

export function TokenNameLabel({ name, size }: TokenNameLabelProps) {
  const theme = useMantineTheme();
  const { groupRef, zoom } = useStageZoom();
  const bottom = { x: size / 2, y: size };

  return (
    <Group ref={groupRef} listening={false}>
      <MapLabel
        at={bottom}
        awayFrom={{ x: size / 2, y: size / 2 }}
        gap={GAP / zoom}
        zoom={zoom}
        color={highlightColor(theme)}
        text={name}
      />
    </Group>
  );
}
