import { Box, useMantineTheme } from "@mantine/core";
import { clamp, useElementSize, useHotkeys } from "@mantine/hooks";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Stage as StageNode } from "konva/lib/Stage";
import type { Vector2d } from "konva/lib/types";
import {
  useEffect,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
} from "react";
import { rollDie } from "../../../shared/dice";
import { droppedDie, isDieDrag } from "../dice/dieDrag";
import {
  dragVelocity,
  SWING_WINDOW_MS,
  throwPath,
  type DragSample,
} from "../dice/throwPath";
import { Layer, Stage } from "react-konva";
import type { Awareness } from "../room/connectRoom";
import type { PlayerColor } from "../room/playerColors";
import { useRoom } from "../room/RoomContext";
import { Cells } from "./Cells";
import { cursorArrowCss } from "./cursorArrow";
import { Cursors } from "./Cursors";
import { GridLines } from "./GridLines";
import { CELL_SIZE, clampToMap, containsCell } from "../room/grid";
import { Strokes } from "./Strokes";
import { ThrownDice } from "./ThrownDice";
import { Tokens } from "./Tokens";
import { paintColorValue, type PaintColor } from "./paintColors";
import { MapResizer } from "./MapResizer";
import { SelectionFrame } from "./SelectionFrame";
import { Toolbar, type Tool } from "./Toolbar";
import { useClipboard } from "./useClipboard";
import { useCursorBroadcast } from "./useCursorBroadcast";
import { useSelection } from "./useSelection";

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
  return {
    x: Math.floor(point.x / CELL_SIZE),
    y: Math.floor(point.y / CELL_SIZE),
  };
}

function isAddKeyPressed(event: KonvaEventObject<MouseEvent>) {
  return event.evt.ctrlKey || event.evt.metaKey;
}

interface BoardProps {
  awareness: Awareness | null;
  playerName: string;
  playerColor: PlayerColor;
  isSynced: boolean;
}

export function Board({
  awareness,
  playerName,
  playerColor,
  isSynced,
}: BoardProps) {
  const room = useRoom();
  const { ref: sizeRef, width, height } = useElementSize();
  const theme = useMantineTheme();
  const [tool, setTool] = useState<Tool>("select");
  const [color, setColor] = useState<PaintColor>("red");
  const [draftPoints, setDraftPoints] = useState<number[] | null>(null);
  const selection = useSelection(room);
  const { area, strokeIds: selectedStrokeIds } = selection;
  const lastPointer = useRef<Vector2d | null>(null);
  const clipboard = useClipboard({
    room,
    selection,
    pointer: lastPointer,
    onPaste: () => setTool("select"),
  });
  const isPressed = useRef(false);
  const stageRef = useRef<StageNode>(null);
  const dragSamples = useRef<DragSample[]>([]);
  const cursor = useCursorBroadcast(awareness, playerName, playerColor);

  // Keeps the browser's own copy and paste working, e.g. for text in the dice history.
  const keepDefault = { preventDefault: false };
  useHotkeys([
    ["Escape", selection.clear],
    ["mod+C", clipboard.copy, keepDefault],
    ["mod+X", clipboard.cut, keepDefault],
    ["mod+V", clipboard.paste, keepDefault],
    ["Delete", clipboard.remove, keepDefault],
  ]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) throw new Error("Stage is not mounted");
    stage.x(MAP_START_X);
  }, []);

  function viewCenter() {
    const stage = stageRef.current;
    if (!stage) throw new Error("Stage is not mounted");
    const center = stage
      .getAbsoluteTransform()
      .copy()
      .invert()
      .point({ x: stage.width() / 2, y: stage.height() / 2 });
    return clampToMap(center, room.mapBounds());
  }

  const isSelecting = tool === "select";
  const colorValue = paintColorValue(theme, color);

  function applyAtPointer(event: KonvaEventObject<MouseEvent>) {
    const cell = cellAt(pointerOnMap(event));
    const isOnMap = containsCell(room.mapBounds(), cell.x, cell.y);
    if (tool === "paint" && isOnMap) {
      room.paintCell(cell.x, cell.y, colorValue);
    }
    if (tool === "eraser") {
      // Also off the map, to clean up cells left there by players resizing at the same time.
      room.eraseCell(cell.x, cell.y);
      const strokeId = strokeIdAtPointer(event);
      if (strokeId) room.removeStroke(strokeId);
    }
  }

  function pressStroke(id: string, event: KonvaEventObject<MouseEvent>) {
    if (!isSelecting || event.evt.button !== LEFT_MOUSE_BUTTON) return;
    selection.pressStroke(id, isAddKeyPressed(event));
  }

  function clickStroke(id: string, event: KonvaEventObject<MouseEvent>) {
    if (!isSelecting || event.evt.button !== LEFT_MOUSE_BUTTON) return;
    selection.clickStroke(id, isAddKeyPressed(event));
  }

  function changeTool(nextTool: Tool) {
    setTool(nextTool);
    selection.clear();
  }

  function panOnlyWithMiddleButton(event: KonvaEventObject<DragEvent>) {
    const stage = event.target;
    if (stage !== stageRef.current) return;
    if (event.evt.button === LEFT_MOUSE_BUTTON) stage.stopDrag();
  }

  function startArea(event: KonvaEventObject<MouseEvent>) {
    if (event.target !== stageRef.current) return;
    if (isAddKeyPressed(event)) return;
    selection.beginArea(pointerOnMap(event));
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
    cursor.move(lastPointer.current);
    selection.extendArea(lastPointer.current);
    if (isPressed.current) applyAtPointer(event);
    if (draftPoints) {
      const point = pointerOnMap(event);
      setDraftPoints((points) => points && [...points, point.x, point.y]);
    }
  }

  function handleMouseUp() {
    selection.endArea();
    isPressed.current = false;
    if (draftPoints && draftPoints.length >= 4) {
      room.addStroke(colorValue, draftPoints);
    }
    setDraftPoints(null);
  }

  function handleMouseLeave() {
    cursor.leave();
    handleMouseUp();
  }

  function dragPointOnMap(event: ReactDragEvent<HTMLDivElement>) {
    const stage = stageRef.current;
    if (!stage) throw new Error("Stage is not mounted");
    stage.setPointersPositions(event.nativeEvent);
    const point = stage.getRelativePointerPosition();
    if (!point) throw new Error("Drag without stage pointer");
    return point;
  }

  function trackDieDrag(event: ReactDragEvent<HTMLDivElement>) {
    if (!isDieDrag(event.dataTransfer)) return;
    event.preventDefault();
    const time = event.timeStamp;
    dragSamples.current = [
      ...dragSamples.current.filter(
        (sample) => time - sample.time <= SWING_WINDOW_MS,
      ),
      { ...dragPointOnMap(event), time },
    ];
  }

  function rollDroppedDie(event: ReactDragEvent<HTMLDivElement>) {
    const sides = droppedDie(event.dataTransfer);
    if (!sides) return;
    event.preventDefault();
    const point = dragPointOnMap(event);
    const velocity = dragVelocity([
      ...dragSamples.current,
      { ...point, time: event.timeStamp },
    ]);
    dragSamples.current = [];
    const bounds = room.mapBounds();
    const cell = cellAt(point);
    if (!containsCell(bounds, cell.x, cell.y)) return;
    const path = throwPath(point, velocity, bounds);
    const [x, y] = path.slice(-2);
    if (x === undefined || y === undefined) throw new Error("Empty throw path");
    room.addRoll(
      playerName,
      playerColor,
      sides,
      rollDie(sides),
      { x, y },
      path,
    );
  }

  return (
    <Box
      ref={sizeRef}
      pos="relative"
      h="calc(100dvh - var(--app-shell-header-height))"
      style={{ cursor: cursorArrowCss(theme.colors[playerColor][6]) }}
      onDragOver={trackDieDrag}
      onDrop={rollDroppedDie}
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
        <Layer listening={false}>
          <Cells selection={area} />
          <GridLines />
        </Layer>
        <Layer>
          <Strokes
            draft={draftPoints && { color: colorValue, points: draftPoints }}
            selection={area}
            selectedIds={selectedStrokeIds}
            listening={tool === "eraser" || isSelecting}
            draggable={isSelecting}
            onStrokePress={pressStroke}
            onStrokeClick={clickStroke}
            onStrokesMove={room.moveStrokes}
          />
          <Tokens listening={isSelecting} selection={area} />
        </Layer>
        <Layer>
          {isSelecting && <MapResizer />}
          <SelectionFrame area={area} onMove={selection.moveArea} />
          {isSynced && <ThrownDice viewCenter={viewCenter} />}
          <Cursors awareness={awareness} />
        </Layer>
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
