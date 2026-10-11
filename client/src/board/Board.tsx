import { Box, useMantineTheme } from "@mantine/core";
import { clamp, useElementSize, useHotkeys } from "@mantine/hooks";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Stage as StageNode } from "konva/lib/Stage";
import type { Vector2d } from "konva/lib/types";
import { useEffect, useRef, useState } from "react";
import { useDieDrop } from "../dice/useDieDrop";
import { Layer, Stage } from "react-konva";
import type { ItemType } from "../room/areaActions";
import type { Awareness } from "../room/connectRoom";
import { usePlayer } from "../player/PlayerContext";
import { useRoom } from "../room/RoomContext";
import { useBackgroundImage } from "../room/useBackgroundImage";
import { Cells } from "./Cells";
import { cursorArrowCss } from "./cursorArrow";
import { Cursors } from "./Cursors";
import { DistanceMeasure } from "./DistanceMeasure";
import { GridLines } from "./GridLines";
import { clampToMap } from "../room/grid";
import { Strokes } from "./Strokes";
import { ThrownDice } from "./ThrownDice";
import { Tokens } from "./Tokens";
import { paintColorValue, type PaintColor } from "./paintColors";
import { MapFill } from "./MapFill";
import { MapResizer } from "./MapResizer";
import { resizableTokenId } from "./selection";
import { SelectionFrame } from "./SelectionFrame";
import { Toolbar, type Tool } from "./Toolbar";
import { selectTool } from "./tools/select";
import { usePaintTool } from "./tools/paint";
import { usePenTool } from "./tools/pen";
import { useEraserTool } from "./tools/eraser";
import { useMeasureTool } from "./tools/measure";
import type { BoardTool } from "./tools/tool";
import { useClipboard } from "./useClipboard";
import { useCursorBroadcast } from "./useCursorBroadcast";
import { useImageDrop } from "./useImageDrop";
import { useItemDrag } from "./useItemDrag";
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

function isAddKeyPressed(event: KonvaEventObject<MouseEvent>) {
  return event.evt.ctrlKey || event.evt.metaKey;
}

interface BoardProps {
  awareness: Awareness | null;
  isSynced: boolean;
}

export function Board({ awareness, isSynced }: BoardProps) {
  const room = useRoom();
  const player = usePlayer();
  const { ref: sizeRef, width, height } = useElementSize();
  const theme = useMantineTheme();
  const [tool, setTool] = useState<Tool>("select");
  const [color, setColor] = useState<PaintColor>("red");
  const selection = useSelection(room);
  const select = selectTool(selection);
  const colorValue = paintColorValue(theme, color);
  const paint = usePaintTool(room, colorValue);
  const { tool: pen, draftPoints } = usePenTool(room, colorValue);
  const eraser = useEraserTool(room);
  const { tool: measure, measurement } = useMeasureTool(room);
  const tools: Record<Tool, BoardTool> = {
    select,
    paint,
    pen,
    eraser,
    measure,
  };
  const activeTool = tools[tool];
  const { area, items } = selection;
  const itemDrag = useItemDrag(room, items);
  const lastPointer = useRef<Vector2d | null>(null);
  const clipboard = useClipboard({
    room,
    selection,
    pointer: lastPointer,
    onPaste: () => changeTool("select"),
  });
  const stageRef = useRef<StageNode>(null);
  const cursor = useCursorBroadcast(awareness);
  const dieDrop = useDieDrop({ stageRef });
  const imageDrop = useImageDrop(stageRef);
  const backgroundImage = useBackgroundImage();

  // Keeps the browser's own copy and paste working, e.g. for text in the dice history.
  const keepDefault = { preventDefault: false };
  useHotkeys([
    [
      "Escape",
      () => {
        measure.onUp();
        selection.clear();
      },
    ],
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

  const isSelecting = activeTool.selectsItems;

  function isSelectClick(event: KonvaEventObject<MouseEvent>) {
    return isSelecting && event.evt.button === LEFT_MOUSE_BUTTON;
  }

  function pressItem(type: ItemType) {
    return (id: string, event: KonvaEventObject<MouseEvent>) => {
      if (isSelectClick(event)) {
        selection.pressItem(type, id, isAddKeyPressed(event));
      }
    };
  }

  function clickItem(type: ItemType) {
    return (id: string, event: KonvaEventObject<MouseEvent>) => {
      if (isSelectClick(event)) {
        selection.clickItem(type, id, isAddKeyPressed(event));
      }
    };
  }

  function changeTool(nextTool: Tool) {
    handleMouseUp();
    setTool(nextTool);
    selection.clear();
  }

  function panOnlyWithMiddleButton(event: KonvaEventObject<DragEvent>) {
    const stage = event.target;
    if (stage !== stageRef.current) return;
    if (event.evt.button === LEFT_MOUSE_BUTTON) stage.stopDrag();
  }

  function handleMouseDown(event: KonvaEventObject<MouseEvent>) {
    if (event.evt.button !== LEFT_MOUSE_BUTTON) return;
    activeTool.onDown({ point: pointerOnMap(event), event });
  }

  function handleMouseMove(event: KonvaEventObject<MouseEvent>) {
    lastPointer.current = pointerOnMap(event);
    cursor.move(lastPointer.current);
    activeTool.onMove({ point: lastPointer.current, event });
  }

  function handleMouseUp() {
    activeTool.onUp();
  }

  function handleMouseLeave() {
    cursor.leave();
    handleMouseUp();
  }

  return (
    <Box
      ref={sizeRef}
      pos="relative"
      h="calc(100dvh - var(--app-shell-header-height))"
      style={{
        cursor: cursorArrowCss(theme.colors[player.color][6]),
        backgroundImage: backgroundImage ? `url("${backgroundImage}")` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      onDragOver={(event) => {
        dieDrop.onDragOver(event);
        imageDrop.onDragOver(event);
      }}
      onDrop={(event) => {
        dieDrop.onDrop(event);
        imageDrop.onDrop(event);
      }}
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
          <MapFill />
          <Cells selection={area} />
          <GridLines />
        </Layer>
        <Layer
          onDragStart={itemDrag.start}
          onDragMove={itemDrag.move}
          onDragEnd={itemDrag.end}
        >
          <Strokes
            draft={draftPoints && { color: colorValue, points: draftPoints }}
            selection={area}
            selectedIds={items.strokes}
            listening={activeTool.listensToStrokes}
            draggable={isSelecting}
            onStrokePress={pressItem("strokes")}
            onStrokeClick={clickItem("strokes")}
          />
          <Tokens
            listening={isSelecting}
            selection={area}
            selectedIds={items.tokens}
            resizableId={resizableTokenId(items)}
            onTokenPress={pressItem("tokens")}
            onTokenClick={clickItem("tokens")}
          />
        </Layer>
        <Layer>
          {isSelecting && <MapResizer />}
          <SelectionFrame area={area} onMove={selection.moveArea} />
          {isSynced && <ThrownDice viewCenter={viewCenter} />}
          <DistanceMeasure
            measurement={measurement}
            color={theme.colors[player.color][6]}
          />
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
