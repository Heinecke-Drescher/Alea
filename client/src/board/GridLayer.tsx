import { useComputedColorScheme, useMantineTheme } from "@mantine/core";
import { Layer, Line } from "react-konva";
import { CELL_SIZE, COLUMNS, MAP_HEIGHT, MAP_WIDTH, ROWS } from "./grid";

const COLUMN_LINES = Array.from(
  { length: COLUMNS + 1 },
  (_, i) => i * CELL_SIZE,
);
const ROW_LINES = Array.from({ length: ROWS + 1 }, (_, i) => i * CELL_SIZE);

export function GridLayer() {
  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme("light");
  const lineColor =
    colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[4];

  return (
    <Layer listening={false}>
      {COLUMN_LINES.map((x) => (
        <Line
          key={`column-${x}`}
          points={[x, 0, x, MAP_HEIGHT]}
          stroke={lineColor}
        />
      ))}
      {ROW_LINES.map((y) => (
        <Line
          key={`row-${y}`}
          points={[0, y, MAP_WIDTH, y]}
          stroke={lineColor}
        />
      ))}
    </Layer>
  );
}
