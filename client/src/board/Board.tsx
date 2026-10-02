import { Box, useMantineTheme } from "@mantine/core";
import {
  clamp,
  useElementSize,
  useHotkeys,
  useThrottledCallback,
} from "@mantine/hooks";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Stage as StageNode } from "konva/lib/Stage";
import type { IRect, Vector2d } from "konva/lib/types";
import { useEffect, useRef, useState } from "react";
import { Stage } from "react-konva";
import type { Awareness } from "../room/connectRoom";
import type { Clip } from "../room/createRoom";
import { useRoom } from "../room/RoomContext";
import { CellLayer } from "./CellLayer";
import { CursorLayer } from "./CursorLayer";
import { GridLayer } from "./GridLayer";
import { StrokeLayer } from "./StrokeLayer";
import { CELL_SIZE, COLUMNS, ROWS } from "./grid";
import { TokenLayer } from "./TokenLayer";
import { paintColorValue, type PaintColor } from "./paintColors";
import {
  boxBetween,
  cellOffset,
  clipToMap,
  linesBounds,
  pixelOffset,
} from "./selection";
import { SelectionLayer } from "./SelectionLayer";
import { Toolbar, type Tool } from "./Toolbar";

interface Clipboard {
  clip: Clip;
  bounds: IRect;
  snapsToCells: boolean;
}

const LEFT_MOUSE_BUTTON = 0;
const CURSOR_INTERVAL_MS = 50;
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

function isAddKeyPressed(event: KonvaEventObject<MouseEvent>) {
  return event.evt.ctrlKey || event.evt.metaKey;
}

interface BoardProps {
  awareness: Awareness | null;
  playerName: string;
}

export function Board({ awareness, playerName }: BoardProps) {
  const room = useRoom();
  const { ref, width, height } = useElementSize();
  const theme = useMantineTheme();
  const [tool, setTool] = useState<Tool>("select");
  const [color, setColor] = useState<PaintColor>("red");
  const [draftPoints, setDraftPoints] = useState<number[] | null>(null);
  const [area, setArea] = useState<IRect | null>(null);
  const [selectedStrokeIds, setSelectedStrokeIds] = useState<string[]>([]);
  const clipboard = useRef<Clipboard | null>(null);
  const lastPointer = useRef<Vector2d | null>(null);
  const addedOnPress = useRef<string | null>(null);
  const areaStart = useRef<Vector2d | null>(null);
  const isPressed = useRef(false);
  const stageRef = useRef<StageNode>(null);
  const sendCursor = useThrottledCallback(
    (cursor: Vector2d | null) =>
      awareness?.setLocalStateField("cursor", cursor),
    CURSOR_INTERVAL_MS,
  );

  // Keeps the browser's own copy and paste working, e.g. for text in the dice history.
  const keepDefault = { preventDefault: false };
  useHotkeys([
    ["Escape", clearSelection],
    ["mod+C", copySelection, keepDefault],
    ["mod+X", cutSelection, keepDefault],
    ["mod+V", pasteClipboard, keepDefault],
    ["Delete", deleteSelection, keepDefault],
  ]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) throw new Error("Stage is not mounted");
    stage.x(MAP_START_X);
  }, []);

  useEffect(() => {
    const clear = () => {
      setArea(null);
      setSelectedStrokeIds([]);
    };
    room.undoManager.on("stack-item-popped", clear);
    return () => room.undoManager.off("stack-item-popped", clear);
  }, [room]);

  useEffect(() => {
    awareness?.setLocalStateField("name", playerName);
  }, [awareness, playerName]);
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
    setSelectedStrokeIds([]);
  }

  function copySelection() {
    if (area) {
      clipboard.current = {
        clip: room.copyArea(area),
        bounds: area,
        snapsToCells: true,
      };
      return;
    }
    const clip = room.copyStrokes(selectedStrokeIds);
    if (clip.strokes.length === 0) return;
    clipboard.current = {
      clip,
      bounds: linesBounds(clip.strokes.map((stroke) => stroke.points)),
      snapsToCells: false,
    };
  }

  function cutSelection() {
    copySelection();
    deleteSelection();
  }

  function deleteSelection() {
    if (area) {
      room.deleteArea(area);
    } else if (selectedStrokeIds.length > 0) {
      room.deleteStrokes(selectedStrokeIds);
    }
    clearSelection();
  }

  function pasteClipboard() {
    if (!clipboard.current) return;
    const { clip, bounds, snapsToCells } = clipboard.current;
    // Before the mouse has been over the map, paste where the copy came from.
    const target = lastPointer.current ?? bounds;
    setTool("select");
    setArea(null);
    if (snapsToCells) {
      const { dx, dy } = cellOffset(bounds, target);
      room.paste(clip, dx * CELL_SIZE, dy * CELL_SIZE);
      // A frame around the paste would also catch what was there before.
      setSelectedStrokeIds([]);
    } else {
      const { dx, dy } = pixelOffset(bounds, target);
      setSelectedStrokeIds(room.paste(clip, dx, dy));
    }
  }

  function pressStroke(id: string, event: KonvaEventObject<MouseEvent>) {
    if (!isSelecting || event.evt.button !== LEFT_MOUSE_BUTTON) return;
    setArea(null);
    addedOnPress.current = null;
    if (selectedStrokeIds.includes(id)) return;
    if (isAddKeyPressed(event)) {
      addedOnPress.current = id;
      setSelectedStrokeIds([...selectedStrokeIds, id]);
    } else {
      setSelectedStrokeIds([id]);
    }
  }

  // Removing waits for the click, so Ctrl+drag on a selected stroke still drags the whole selection.
  function clickStroke(id: string, event: KonvaEventObject<MouseEvent>) {
    if (!isSelecting || event.evt.button !== LEFT_MOUSE_BUTTON) return;
    if (!isAddKeyPressed(event) || addedOnPress.current === id) return;
    setSelectedStrokeIds(selectedStrokeIds.filter((other) => other !== id));
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
    if (isAddKeyPressed(event)) return;
    areaStart.current = pointerOnMap(event);
    clearSelection();
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
    lastPointer.current = pointerOnMap(event);
    sendCursor(lastPointer.current);
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

  function handleMouseLeave() {
    sendCursor(null);
    handleMouseUp();
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
        onMouseLeave={handleMouseLeave}
      >
        <CellLayer />
        <GridLayer />
        <StrokeLayer
          draft={draftPoints && { color: colorValue, points: draftPoints }}
          selection={area}
          selectedIds={selectedStrokeIds}
          listening={tool === "eraser" || isSelecting}
          draggable={isSelecting}
          onStrokePress={pressStroke}
          onStrokeClick={clickStroke}
          onStrokesMove={room.moveStrokes}
        />
        <TokenLayer listening={isSelecting} />
        <SelectionLayer area={area} onMove={moveArea} />
        <CursorLayer awareness={awareness} />
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
