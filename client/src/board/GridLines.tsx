import { useComputedColorScheme, useMantineTheme } from "@mantine/core";
import { Group, Line } from "react-konva";
import { useMapBounds } from "../room/useMapBounds";
import { CELL_SIZE, mapRect } from "../room/grid";

function linePositions(start: number, count: number) {
  return Array.from({ length: count + 1 }, (_, i) => start + i * CELL_SIZE);
}

export function GridLines() {
  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme("light");
  const bounds = useMapBounds();
  const { x, y, width, height } = mapRect(bounds);
  const lineColor =
    colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[4];

  return (
    <Group listening={false}>
      {linePositions(x, bounds.columns).map((lineX) => (
        <Line
          key={`column-${lineX}`}
          points={[lineX, y, lineX, y + height]}
          stroke={lineColor}
        />
      ))}
      {linePositions(y, bounds.rows).map((lineY) => (
        <Line
          key={`row-${lineY}`}
          points={[x, lineY, x + width, lineY]}
          stroke={lineColor}
        />
      ))}
    </Group>
  );
}
