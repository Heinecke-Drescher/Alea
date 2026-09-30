import { Box, useComputedColorScheme, useMantineTheme } from "@mantine/core";
import { clamp, useElementSize } from "@mantine/hooks";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Vector2d } from "konva/lib/types";
import { useRef, useState } from "react";
import { Layer, Line, Stage } from "react-konva";
import { useRoom } from "../room/RoomContext";
import { CellLayer } from "./CellLayer";
import { StrokeLayer } from "./StrokeLayer";
import { CELL_SIZE, COLUMNS, MAP_HEIGHT, MAP_WIDTH, ROWS } from "./grid";
import { TokenLayer } from "./TokenLayer";
import type { PaintColor } from "./paintColors";
import { Toolbar, type Tool } from "./Toolbar";

const COLUMN_LINES = Array.from(
  { length: COLUMNS + 1 },
  (_, i) => i * CELL_SIZE,
);
const ROW_LINES = Array.from({ length: ROWS + 1 }, (_, i) => i * CELL_SIZE);

const LEFT_MOUSE_BUTTON = 0;
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

function pointerOnMap(event: KonvaEventObject<MouseEvent>) {
  const pointer = event.target.getStage()?.getRelativePointerPosition();
  if (!pointer) throw new Error("Mouse event without stage pointer");
  return pointer;
}

function strokeIdAtPointer(event: KonvaEventObject<MouseEvent>) {
  const stage = event.target.getStage();
  const pointer = stage?.getPointerPosition();
  if (!stage || !pointer) throw new Error("Mouse event without stage pointer");
  return stage.getIntersection(pointer)?.id();
}

function cellAt(point: Vector2d) {
  const x = Math.floor(point.x / CELL_SIZE);
  const y = Math.floor(point.y / CELL_SIZE);
  const isOnMap = x >= 0 && y >= 0 && x < COLUMNS && y < ROWS;
  return isOnMap ? { x, y } : null;
}

export function Board() {
  const room = useRoom();
  const { ref, width, height } = useElementSize();
  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme("light");
  const lineColor =
    colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[4];
  const [tool, setTool] = useState<Tool>("select");
  const [color, setColor] = useState<PaintColor>("red");
  const [draftPoints, setDraftPoints] = useState<number[] | null>(null);
  const isPressed = useRef(false);
  const isSelecting = tool === "select";
  const colorValue = theme.colors[color][6];

  function applyAtPointer(event: KonvaEventObject<MouseEvent>) {
    const cell = cellAt(pointerOnMap(event));
    if (tool === "paint" && cell) room.paintCell(cell.x, cell.y, colorValue);
    if (tool === "eraser") {
      if (cell) room.eraseCell(cell.x, cell.y);
      const strokeId = strokeIdAtPointer(event);
      if (strokeId) room.removeStroke(strokeId);
    }
  }

  function handleMouseDown(event: KonvaEventObject<MouseEvent>) {
    if (event.evt.button !== LEFT_MOUSE_BUTTON) return;
    if (tool === "paint" || tool === "eraser") {
      isPressed.current = true;
      applyAtPointer(event);
    }
    if (tool === "pen") {
      const point = pointerOnMap(event);
      setDraftPoints([point.x, point.y]);
    }
  }

  function handleMouseMove(event: KonvaEventObject<MouseEvent>) {
    if (isPressed.current) applyAtPointer(event);
    if (draftPoints) {
      const point = pointerOnMap(event);
      setDraftPoints((points) => points && [...points, point.x, point.y]);
    }
  }

  function handleMouseUp() {
    isPressed.current = false;
    if (draftPoints && draftPoints.length >= 4) {
      room.addStroke(colorValue, draftPoints);
    }
    setDraftPoints(null);
  }

  return (
    <Box
      ref={ref}
      pos="relative"
      h="calc(100dvh - var(--app-shell-header-height))"
    >
      <Stage
        width={width}
        height={height}
        draggable={isSelecting}
        onWheel={zoomAtPointer}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <CellLayer />
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
        <StrokeLayer
          draft={draftPoints && { color: colorValue, points: draftPoints }}
          listening={tool === "eraser"}
        />
        <TokenLayer listening={isSelecting} />
      </Stage>
      <Toolbar
        activeTool={tool}
        onToolChange={setTool}
        activeColor={color}
        onColorChange={setColor}
      />
    </Box>
  );
}
