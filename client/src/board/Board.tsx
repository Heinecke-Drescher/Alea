import { Box, useMantineTheme } from "@mantine/core";
import { useElementSize, useHotkeys } from "@mantine/hooks";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Stage as StageNode } from "konva/lib/Stage";
import type { Vector2d } from "konva/lib/types";
import {
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";
import { Layer, Stage } from "react-konva";
import type { Critical } from "../dice/criticalRoll";
import { usePlayer } from "../player/PlayerContext";
import type { ItemType } from "../room/areaActions";
import type { Awareness } from "../room/connection/connectRoom";
import { useRoom } from "../room/RoomContext";
import { squareCenter } from "../room/grid";
import { useBackgroundImage } from "../room/useBackgroundImage";
import { cursorArrowCss } from "./cursorArrow";
import { Cursors } from "./Cursors";
import { Pings } from "./Pings";
import { Cells } from "./map/Cells";
import { FogOfWar } from "./map/FogOfWar";
import { GridLines } from "./map/GridLines";
import { MapFill } from "./map/MapFill";
import { MapImage } from "./map/MapImage";
import { MapResizer } from "./map/MapResizer";
import { CriticalScenes } from "./critical/CriticalScenes";
import { paintColorValue, type PaintColor } from "./paintColors";
import {
  itemsSelection,
  reshapableStrokeId,
  resizableTokenId,
} from "./selection/selection";
import { SelectionFrame } from "./selection/SelectionFrame";
import { ShapeResizer } from "./selection/ShapeResizer";
import { useBoardMenu } from "./selection/useBoardMenu";
import { useClipboard } from "./selection/useClipboard";
import { useItemDrag } from "./selection/useItemDrag";
import { useSelection } from "./selection/useSelection";
import { Strokes } from "./Strokes";
import { ThrownDice } from "./dice/ThrownDice";
import { EffectTooltip } from "./tokens/EffectTooltip";
import { isOnToken } from "./tokens/tokenNodes";
import { Tokens } from "./tokens/Tokens";
import { useTokenMenu } from "./tokens/useTokenMenu";
import { Toolbar } from "./Toolbar";
import { DistanceMeasure } from "./tools/DistanceMeasure";
import { FogFrame } from "./tools/FogFrame";
import { ShapePreview } from "./tools/ShapePreview";
import { TextEditor } from "./texts/TextEditor";
import { Texts } from "./texts/Texts";
import { isFogTool, type Tool } from "./tools/tool";
import { useBoardTools } from "./tools/useBoardTools";
import { LEFT_MOUSE_BUTTON } from "./mouse";
import { useBoardView } from "./useBoardView";
import { useCursorBroadcast } from "./useCursorBroadcast";
import { useFitOnNewMap } from "./useFitOnNewMap";
import { usePingBroadcast } from "./usePingBroadcast";
import { useBoardDrops } from "./useBoardDrops";
import { ViewControls } from "./ViewControls";

function pointerOnMap(event: KonvaEventObject<MouseEvent>) {
  const pointer = event.target.getStage()?.getRelativePointerPosition();
  if (!pointer) throw new Error("Mouse event without stage pointer");
  return pointer;
}

function isAddKeyPressed(event: KonvaEventObject<MouseEvent>) {
  return event.evt.ctrlKey || event.evt.metaKey;
}

export interface BoardHandle {
  focusToken: (id: string) => void;
}

interface BoardProps {
  awareness: Awareness | null;
  isSynced: boolean;
  critical: Critical | null;
  onCriticalDone: (id: string) => void;
  onSelectedTokensChange: (ids: readonly string[]) => void;
  ref: Ref<BoardHandle>;
}

export function Board({
  awareness,
  isSynced,
  critical,
  onCriticalDone,
  onSelectedTokensChange,
  ref,
}: BoardProps) {
  const room = useRoom();
  const player = usePlayer();
  const { ref: sizeRef, width, height } = useElementSize();
  const theme = useMantineTheme();
  const [chosenTool, setTool] = useState<Tool>("select");
  // Releasing the DM role while a fog tool is active falls back to selecting.
  const tool = player.isDm || !isFogTool(chosenTool) ? chosenTool : "select";
  const [color, setColor] = useState<PaintColor>("red");
  const [landings] = useState(() => new Map<string, Vector2d>());
  const selection = useSelection(room);
  const colorValue = paintColorValue(theme, color);
  const { activeTool, draftPoints, measurement, shapeDraft, fogFrame, texts } =
    useBoardTools(tool, selection, room, colorValue, selectPlacedShape);
  const { area, items } = selection;
  const reshapableId = reshapableStrokeId(items);
  const itemDrag = useItemDrag(room, items);
  const lastPointer = useRef<Vector2d | null>(null);
  const clipboard = useClipboard({
    room,
    selection,
    pointer: lastPointer,
    onPaste: () => changeTool("select"),
  });
  const tokenMenu = useTokenMenu(room, selection, clipboard);
  const boardMenu = useBoardMenu(selection, clipboard);
  const stageRef = useRef<StageNode>(null);
  const {
    panOrZoom,
    panOnlyWithMiddleButton,
    viewCenter,
    fitMap,
    centerOn,
    zoomIn,
    zoomOut,
  } = useBoardView(room, stageRef);
  const cursor = useCursorBroadcast(awareness);
  const sendPing = usePingBroadcast(awareness);
  const drops = useBoardDrops(stageRef, selectToken);
  const backgroundImage = useBackgroundImage();
  useFitOnNewMap(fitMap, width > 0 && height > 0, isSynced);

  // Reported only when the ids change, as the page around the board renders again with them.
  const selectedTokensKey = items.tokens.join(" ");
  const reportSelectedTokens = useEffectEvent(() =>
    onSelectedTokensChange(items.tokens),
  );
  useEffect(() => reportSelectedTokens(), [selectedTokensKey]);

  // Keeps the browser's own copy and paste working, e.g. for text in the dice history.
  const keepDefault = { preventDefault: false };
  useHotkeys([
    [
      "Escape",
      () => {
        activeTool.onCancel?.();
        selection.clear();
      },
    ],
    ["mod+C", clipboard.copy, keepDefault],
    ["mod+X", clipboard.cut, keepDefault],
    ["mod+V", clipboard.paste, keepDefault],
    ["Delete", clipboard.remove, keepDefault],
    // The physical key, since Shift+1 types another character on many layouts.
    ["shift+Digit1", fitMap, { usePhysicalKeys: true }],
  ]);

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

  const draft = draftPoints && { color: colorValue, points: draftPoints };
  const strokeProps = {
    selection: area,
    selectedIds: items.strokes,
    listening: activeTool.listensToStrokes,
    draggable: isSelecting,
    onStrokePress: pressItem("strokes"),
    onStrokeClick: clickItem("strokes"),
  };

  function changeTool(nextTool: Tool) {
    handleMouseUp();
    setTool(nextTool);
    selection.clear();
  }

  function selectPlacedShape(id: string) {
    changeTool("select");
    selection.set(itemsSelection({ strokes: [id], tokens: [] }));
  }

  function selectToken(id: string) {
    changeTool("select");
    selection.set(itemsSelection({ strokes: [], tokens: [id] }));
  }

  function focusToken(id: string) {
    const token = room.tokensMap.get(id);
    if (!token) return;
    selectToken(id);
    centerOn(squareCenter(token.x, token.y, token.size));
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

  useImperativeHandle(ref, () => ({ focusToken }));

  return (
    <EffectTooltip stageRef={stageRef}>
      <Box
        ref={sizeRef}
        pos="relative"
        h="calc(100dvh - var(--app-shell-header-height))"
        style={{
          cursor: cursorArrowCss(theme.colors[player.color][6]),
          backgroundImage: backgroundImage
            ? `url("${backgroundImage}")`
            : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        onDragOver={drops.onDragOver}
        onDrop={drops.onDrop}
      >
        <Stage
          width={width}
          height={height}
          ref={stageRef}
          draggable
          onDragStart={panOnlyWithMiddleButton}
          onWheel={(event) => {
            panOrZoom(event);
            // The map moved under a still pointer, so tools and cursors follow as if it had moved.
            handleMouseMove(event);
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onDblClick={(event) => {
            // Double clicks on tokens are kept free for something else.
            if (tool !== "select" || isOnToken(event.target)) return;
            sendPing(pointerOnMap(event));
          }}
          onContextMenu={(event) => boardMenu.open(event, pointerOnMap(event))}
        >
          <Layer listening={false}>
            <MapFill />
            <MapImage />
            <Cells selection={area} />
            <GridLines />
          </Layer>
          <Layer
            onDragStart={itemDrag.start}
            onDragMove={itemDrag.move}
            onDragEnd={itemDrag.end}
          >
            <Strokes
              overFog={false}
              draft={player.isDm ? draft : null}
              {...strokeProps}
            />
            <Texts overFog={false} />
            <Tokens
              listening={isSelecting}
              selection={area}
              selectedIds={items.tokens}
              resizableId={resizableTokenId(items)}
              onTokenPress={pressItem("tokens")}
              onTokenClick={clickItem("tokens")}
              onTokenContextMenu={tokenMenu.open}
            />
          </Layer>
          {/* Its own layer, so the fog is not redrawn with every cursor move. Players' strokes stay visible on top. */}
          <Layer
            onDragStart={itemDrag.start}
            onDragMove={itemDrag.move}
            onDragEnd={itemDrag.end}
          >
            <FogOfWar />
            <Strokes
              overFog
              draft={player.isDm ? null : draft}
              {...strokeProps}
            />
            <Texts overFog />
          </Layer>
          <Layer>
            <FogFrame frame={fogFrame} />
            {tool === "resize" && <MapResizer />}
            {isSelecting && reshapableId && (
              <ShapeResizer strokeId={reshapableId} />
            )}
            <SelectionFrame area={area} onMove={selection.moveArea} />
            {isSynced && (
              <ThrownDice viewCenter={viewCenter} landings={landings} />
            )}
            <CriticalScenes
              critical={critical}
              landings={landings}
              onDone={onCriticalDone}
            />
            <ShapePreview draft={shapeDraft} color={colorValue} />
            {texts.textDraft && (
              <TextEditor
                draft={texts.textDraft}
                color={colorValue}
                onWrite={texts.writeText}
                onFinish={texts.finishText}
                onCancel={texts.cancelText}
              />
            )}
            <DistanceMeasure
              measurement={measurement}
              color={theme.colors[player.color][6]}
            />
            <Pings awareness={awareness} />
            <Cursors awareness={awareness} />
          </Layer>
        </Stage>
        <ViewControls onZoomIn={zoomIn} onZoomOut={zoomOut} onFitMap={fitMap} />
        <Toolbar
          activeTool={tool}
          onToolChange={changeTool}
          activeColor={color}
          onColorChange={setColor}
        />
      </Box>
    </EffectTooltip>
  );
}
