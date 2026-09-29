import { Box, useComputedColorScheme, useMantineTheme } from "@mantine/core";
import { clamp, useElementSize } from "@mantine/hooks";
import type { KonvaEventObject } from "konva/lib/Node";
import { Layer, Line, Stage } from "react-konva";

const COLUMNS = 30;
const ROWS = 20;
const CELL_SIZE = 50;

const MAP_WIDTH = COLUMNS * CELL_SIZE;
const MAP_HEIGHT = ROWS * CELL_SIZE;
const COLUMN_LINES = Array.from(
  { length: COLUMNS + 1 },
  (_, i) => i * CELL_SIZE,
);
const ROW_LINES = Array.from({ length: ROWS + 1 }, (_, i) => i * CELL_SIZE);

const ZOOM_STEP = 1.1;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

function zoomAtPointer(event: KonvaEventObject<WheelEvent>) {
  event.evt.preventDefault();
  if (event.evt.deltaY === 0) return;
  const stage = event.target.getStage();
  const pointer = stage?.getPointerPosition();
  if (!stage || !pointer) throw new Error("Wheel event without stage pointer");

  const oldScale = stage.scaleX();
  const pointOnMap = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale,
  };
  const zoomIn = event.evt.deltaY < 0;
  const newScale = clamp(
    zoomIn ? oldScale * ZOOM_STEP : oldScale / ZOOM_STEP,
    MIN_ZOOM,
    MAX_ZOOM,
  );

  stage.scale({ x: newScale, y: newScale });
  stage.position({
    x: pointer.x - pointOnMap.x * newScale,
    y: pointer.y - pointOnMap.y * newScale,
  });
}

export function Board() {
  const { ref, width, height } = useElementSize();
  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme("light");
  const lineColor =
    colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[4];

  return (
    <Box ref={ref} h="calc(100dvh - var(--app-shell-header-height))">
      <Stage width={width} height={height} draggable onWheel={zoomAtPointer}>
        <Layer>
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
      </Stage>
    </Box>
  );
}
