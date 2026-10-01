import { Box, useMantineTheme } from "@mantine/core";
import { clamp, useElementSize, useHotkeys } from "@mantine/hooks";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Stage as StageNode } from "konva/lib/Stage";
import type { IRect, Vector2d } from "konva/lib/types";
import { useEffect, useRef, useState } from "react";
import { Stage } from "react-konva";
import { useRoom } from "../room/RoomContext";
import { CellLayer } from "./CellLayer";
import { GridLayer } from "./GridLayer";
import { StrokeLayer } from "./StrokeLayer";
import { CELL_SIZE, COLUMNS, ROWS } from "./grid";
import { TokenLayer } from "./TokenLayer";
import { paintColorValue, type PaintColor } from "./paintColors";
import { boxBetween, clipToMap } from "./selection";
import { SelectionLayer } from "./SelectionLayer";
import { Toolbar, type Tool } from "./Toolbar";

const LEFT_MOUSE_BUTTON = 0;
const MAP_START_X = 72;
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
  const [tool, setTool] = useState<Tool>("select");
  const [color, setColor] = useState<PaintColor>("red");
  const [draftPoints, setDraftPoints] = useState<number[] | null>(null);
  const [area, setArea] = useState<IRect | null>(null);
  const areaStart = useRef<Vector2d | null>(null);
  const isPressed = useRef(false);
  const stageRef = useRef<StageNode>(null);

  useHotkeys([["Escape", clearSelection]]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) throw new Error("Stage is not mounted");
    stage.x(MAP_START_X);
  }, []);

  useEffect(() => {
    const clear = () => setArea(null);
    room.undoManager.on("stack-item-popped", clear);
    return () => room.undoManager.off("stack-item-popped", clear);
  }, [room]);
  const isSelecting = tool === "select";
  const colorValue = paintColorValue(theme, color);

  function applyAtPointer(event: KonvaEventObject<MouseEvent>) {
    const cell = cellAt(pointerOnMap(event));
    if (tool === "paint" && cell) room.paintCell(cell.x, cell.y, colorValue);
    if (tool === "eraser") {
      if (cell) room.eraseCell(cell.x, cell.y);
      const strokeId = strokeIdAtPointer(event);
      if (strokeId) room.removeStroke(strokeId);
    }
  }

  function moveArea(dx: number, dy: number) {
    if (!area) throw new Error("Moved a selection that does not exist");
    room.moveArea(area, dx, dy);
    setArea({
      ...area,
      x: area.x + dx * CELL_SIZE,
      y: area.y + dy * CELL_SIZE,
    });
  }

  function clearSelection() {
    setArea(null);
  }

  function changeTool(nextTool: Tool) {
    setTool(nextTool);
    clearSelection();
  }

  function panOnlyWithMiddleButton(event: KonvaEventObject<DragEvent>) {
    const stage = event.target;
    if (stage !== stageRef.current) return;
    if (event.evt.button === LEFT_MOUSE_BUTTON) stage.stopDrag();
  }

  function startArea(event: KonvaEventObject<MouseEvent>) {
    if (event.target !== stageRef.current) return;
    areaStart.current = pointerOnMap(event);
    setArea(null);
  }

  function handleMouseDown(event: KonvaEventObject<MouseEvent>) {
    if (event.evt.button !== LEFT_MOUSE_BUTTON) return;
    if (isSelecting) startArea(event);
    if (tool === "paint" || tool === "eraser") {
      room.undoManager.stopCapturing();
      isPressed.current = true;
      applyAtPointer(event);
    }
    if (tool === "pen") {
      const point = pointerOnMap(event);
      setDraftPoints([point.x, point.y]);
    }
  }

  function handleMouseMove(event: KonvaEventObject<MouseEvent>) {
    if (areaStart.current) {
      setArea(clipToMap(boxBetween(areaStart.current, pointerOnMap(event))));
    }
    if (isPressed.current) applyAtPointer(event);
    if (draftPoints) {
      const point = pointerOnMap(event);
      setDraftPoints((points) => points && [...points, point.x, point.y]);
    }
  }

  function handleMouseUp() {
    areaStart.current = null;
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
        ref={stageRef}
        draggable
        onDragStart={panOnlyWithMiddleButton}
        onWheel={zoomAtPointer}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <CellLayer />
        <GridLayer />
        <StrokeLayer
          draft={draftPoints && { color: colorValue, points: draftPoints }}
          listening={tool === "eraser"}
        />
        <TokenLayer listening={isSelecting} />
        <SelectionLayer area={area} onMove={moveArea} />
      </Stage>
      <Toolbar
        activeTool={tool}
        onToolChange={changeTool}
        activeColor={color}
        onColorChange={setColor}
      />
    </Box>
  );
}
