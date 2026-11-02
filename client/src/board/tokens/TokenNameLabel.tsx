import { useMantineTheme } from "@mantine/core";
import { Group } from "react-konva";
import { highlightColor } from "../selection/highlight";
import { MapLabel } from "../MapLabel";
import { useStageZoom } from "../useStageZoom";

interface TokenNameLabelProps {
  name: string;
  // The token's width and the label's distance below it, in map pixels.
  size: number;
  gap: number;
}

export function TokenNameLabel({ name, size, gap }: TokenNameLabelProps) {
  const theme = useMantineTheme();
  const { groupRef, zoom } = useStageZoom();
  const bottom = { x: size / 2, y: size };

  return (
    <Group ref={groupRef} listening={false}>
      <MapLabel
        at={bottom}
        awayFrom={{ x: size / 2, y: size / 2 }}
        gap={gap}
        zoom={zoom}
        color={highlightColor(theme)}
        text={name}
      />
    </Group>
  );
}
