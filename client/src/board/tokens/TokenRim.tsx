import { useMantineTheme } from "@mantine/core";
import { Circle, Group } from "react-konva";
import { RIM_EDGE_WIDTH, RIM_WIDTH, rimColors } from "../../tokens/tokenRim";

// Inside the token's circle and in map pixels, so it grows with the zoom like a real token's rim.
export function TokenRim({ size }: { size: number }) {
  const theme = useMantineTheme();
  const { rim, edge } = rimColors(theme);
  const middle = size / 2;
  return (
    <Group listening={false}>
      <Circle
        x={middle}
        y={middle}
        radius={middle - RIM_EDGE_WIDTH / 2}
        stroke={edge}
        strokeWidth={RIM_EDGE_WIDTH}
      />
      <Circle
        x={middle}
        y={middle}
        radius={middle - RIM_EDGE_WIDTH - RIM_WIDTH / 2}
        stroke={rim}
        strokeWidth={RIM_WIDTH}
      />
    </Group>
  );
}
