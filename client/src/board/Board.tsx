import { Box, useMantineTheme } from "@mantine/core";
import Konva from "konva";
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
import type { ScreenSample } from "../dice/throwDie";
import type { DieSides } from "../room/dice";
import { useCanAlignMapImage } from "../mapImage/useCanSetMapImage";
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
import { MapImageAligner } from "./map/MapImageAligner";
import { MapResizer } from "./map/MapResizer";
import { CriticalScenes } from "./critical/CriticalScenes";
import { paintColorValue, type PaintColor } from "./paintColors";
import {
  itemsSelection,
  reshapableStrokeId,
  type Selection,
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
import { TEXT_FONT_SIZES, type TextFontSize } from "../room/texts";
import { textIdAt } from "./texts/textNodes";
import { Texts } from "./texts/Texts";
import { isFogTool, type Tool } from "./tools/tool";
import { useBoardTools } from "./tools/useBoardTools";
import { PRIMARY_BUTTON, PRIMARY_BUTTON_FLAG } from "./pointer";
import { useBoardView } from "./useBoardView";
import { useCursorBroadcast } from "./useCursorBroadcast";
import { useFitOnNewMap } from "./useFitOnNewMap";
import { useLongPress } from "./useLongPress";
import { usePingBroadcast } from "./usePingBroadcast";
import { useBoardDrops } from "./useBoardDrops";
import { ViewControls } from "./ViewControls";

function pointerOnMap(event: KonvaEventObject<MouseEvent>) {
  const pointer = event.target.getStage()?.getRelativePointerPosition();
  if (!pointer) throw new Error("Pointer event without stage pointer");
  return pointer;
}

function isAddKeyPressed(event: KonvaEventObject<MouseEvent>) {
  return event.evt.ctrlKey || event.evt.metaKey;
}

export interface BoardHandle {
  focusToken: (id: string) => void;
  alignMapImage: () => void;
  throwDie: (sides: DieSides, samples: ScreenSample[]) => void;
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
  const canAlignMapImage = useCanAlignMapImage();
  // Losing the DM role or the map image while its tool is active falls back to selecting.
  const isToolAllowed =
    (player.isDm || !isFogTool(chosenTool)) &&
    (canAlignMapImage || chosenTool !== "alignImage");
  const tool = isToolAllowed ? chosenTool : "select";
  const [color, setColor] = useState<PaintColor>("red");
  const [textSize, setTextSize] = useState<TextFontSize>(TEXT_FONT_SIZES.M);
  const [landings] = useState(() => new Map<string, Vector2d>());
  const selection = useSelection(room);
  const colorValue = paintColorValue(theme, color);
  const { activeTool, draftPoints, measurement, shapeDraft, fogFrame, texts } =
    useBoardTools(
      tool,
      selection,
      room,
      colorValue,
      textSize,
      selectPlacedShape,
    );
  const { area, items } = selection;
  const reshapableId = reshapableStrokeId(items);
  const itemDrag = useItemDrag(room, items);
  const lastPointer = useRef<Vector2d | null>(null);
  // The pointer that started the tool, so other fingers and a second end event change nothing.
  const toolPointer = useRef<{ id: number; type: string } | null>(null);
  // Items under the first finger select themselves before a second finger makes it a pinch.
  const selectionBeforePress = useRef<Selection | null>(null);
  // Once two fingers touched, fingers do nothing until all are lifted (like Krita), as a finger
  // lifted or briefly lost during a pinch would otherwise select, drag or draw.
  const [areFingersLocked, setFingersLocked] = useState(false);
  const canDragItems = !areFingersLocked;
  const clipboard = useClipboard({
    room,
    selection,
    pointer: lastPointer,
    onPaste: () => changeTool("select"),
  });
  const tokenMenu = useTokenMenu(room, selection, clipboard);
  const boardMenu = useBoardMenu(selection, clipboard);
  const longPress = useLongPress(openPressMenu);
  const stageRef = useRef<StageNode>(null);
  const {
    panOrZoom,
    pinch,
    endPinch,
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
        dropTool();
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
  const textProps = {
    listening: activeTool.listensToDrawings || tool === "text",
    editingId: texts.textDraft?.id ?? null,
    selection: area,
    selectedIds: items.texts,
    draggable: isSelecting && canDragItems,
    onTextPress: pressItem("texts"),
    onTextClick: clickItem("texts"),
  };

  function isSelectClick(event: KonvaEventObject<PointerEvent>) {
    return (
      isSelecting &&
      event.evt.button === PRIMARY_BUTTON &&
      event.evt.isPrimary &&
      !isLockedFinger(event)
    );
  }

  function pressItem(type: ItemType) {
    return (id: string, event: KonvaEventObject<PointerEvent>) => {
      if (isSelectClick(event)) {
        selection.pressItem(type, id, isAddKeyPressed(event));
      }
    };
  }

  function clickItem(type: ItemType) {
    return (id: string, event: KonvaEventObject<PointerEvent>) => {
      if (isSelectClick(event)) {
        selection.clickItem(type, id, isAddKeyPressed(event));
      }
    };
  }

  const draft = draftPoints && { color: colorValue, points: draftPoints };
  const strokeProps = {
    selection: area,
    selectedIds: items.strokes,
    listening: activeTool.listensToDrawings,
    draggable: isSelecting && canDragItems,
    onStrokePress: pressItem("strokes"),
    onStrokeClick: clickItem("strokes"),
  };

  function changeTool(nextTool: Tool) {
    endTool();
    setTool(nextTool);
    selection.clear();
  }

  function selectPlacedShape(id: string) {
    changeTool("select");
    selection.set(itemsSelection({ strokes: [id], tokens: [], texts: [] }));
  }

  function selectToken(id: string) {
    changeTool("select");
    selection.set(itemsSelection({ strokes: [], tokens: [id], texts: [] }));
  }

  function focusToken(id: string) {
    const token = room.tokensMap.get(id);
    if (!token) return;
    selectToken(id);
    centerOn(squareCenter(token.x, token.y, token.size));
  }

  function isOtherPointer(event: KonvaEventObject<PointerEvent>) {
    return (
      toolPointer.current !== null &&
      event.evt.pointerId !== toolPointer.current.id
    );
  }

  function isLockedFinger(event: KonvaEventObject<PointerEvent>) {
    return areFingersLocked && event.evt.pointerType === "touch";
  }

  function handlePointerDown(event: KonvaEventObject<PointerEvent>) {
    if (!event.evt.isPrimary) longPress.cancel();
    if (isLockedFinger(event)) return;
    if (event.evt.button !== PRIMARY_BUTTON || !event.evt.isPrimary) return;
    // Each kind of pointer has its own primary one, e.g. a hand resting while a pen draws.
    const { pointerId: id, pointerType: type } = event.evt;
    const current = toolPointer.current;
    if (current && current.type !== type) {
      // A pen takes over from a hand that touched first; the other way round the hand is ignored.
      if (type !== "pen") return;
      cancelTool();
    }
    toolPointer.current = { id, type };
    // Still the selection from before this press: items change it only for the next render.
    selectionBeforePress.current = selection.selection;
    activeTool.onDown({ point: pointerOnMap(event), event });
    if (isSelecting) longPress.begin(event);
  }

  function handlePointerMove(event: KonvaEventObject<PointerEvent>) {
    if (isOtherPointer(event) || isLockedFinger(event)) return;
    // Releasing the left button while another one is still pressed sends no pointerup.
    const isReleased = !(event.evt.buttons & PRIMARY_BUTTON_FLAG);
    if (toolPointer.current !== null && isReleased) endTool();
    longPress.move(event);
    followPointer(event);
  }

  function followPointer(event: KonvaEventObject<MouseEvent>) {
    lastPointer.current = pointerOnMap(event);
    cursor.move(lastPointer.current);
    activeTool.onMove({ point: lastPointer.current, event });
  }

  // Also gets the pointerup that Konva sends after each pointercancel.
  function handlePointerUp(event: KonvaEventObject<PointerEvent>) {
    if (event.evt.pointerId === toolPointer.current?.id) endTool();
  }

  function handlePointerLeave(event: KonvaEventObject<PointerEvent>) {
    if (isOtherPointer(event)) return;
    cursor.leave();
    if (toolPointer.current !== null) endTool();
  }

  function endTool() {
    longPress.cancel();
    toolPointer.current = null;
    selectionBeforePress.current = null;
    activeTool.onUp();
  }

  // A hand resting while a pen or mouse draws neither stops it nor moves the view.
  function isHandResting() {
    const drawingType = toolPointer.current?.type;
    return drawingType !== undefined && drawingType !== "touch";
  }

  // A second finger turns the touch into moving the view, so the tool stops without a trace.
  // Already when it lands: Konva sends no moves while the first finger drags an item.
  function handleTouchStart(event: KonvaEventObject<TouchEvent>) {
    if (event.evt.touches.length < 2 || isHandResting()) return;
    lockFingers();
    pinch();
  }

  // Read from the touches, as a second finger may land outside the map, e.g. on its buttons.
  function handleTouchMove(event: KonvaEventObject<TouchEvent>) {
    if (isHandResting()) return;
    if (event.evt.touches.length > 1) lockFingers();
    if (event.evt.touches.length === 2) pinch();
    else endPinch();
  }

  function lockFingers() {
    setFingersLocked(true);
    cancelTool();
  }

  // On the window, as the last finger may have started on something else than the map.
  useEffect(() => {
    function unlockWhenAllLifted(event: TouchEvent) {
      if (event.touches.length === 0) setFingersLocked(false);
    }
    window.addEventListener("touchend", unlockWhenAllLifted);
    window.addEventListener("touchcancel", unlockWhenAllLifted);
    return () => {
      window.removeEventListener("touchend", unlockWhenAllLifted);
      window.removeEventListener("touchcancel", unlockWhenAllLifted);
    };
  }, []);

  function dropTool() {
    longPress.cancel();
    toolPointer.current = null;
    selectionBeforePress.current = null;
    activeTool.onCancel();
  }

  // Also takes back what the press did to the selection.
  function cancelTool() {
    const before = selectionBeforePress.current;
    if (toolPointer.current === null || !before) return;
    dropTool();
    selection.set(before);
  }

  // Goes through the right click's handlers, so the press keeps the item it selected for the menu.
  // A dragged item keeps moving instead, as Konva sends no pointer moves to cancel the press then.
  function openPressMenu(event: KonvaEventObject<PointerEvent>) {
    if (Konva.isDragging()) return;
    dropTool();
    event.target.fire("contextmenu", { evt: event.evt }, true);
  }

  useImperativeHandle(ref, () => ({
    focusToken,
    alignMapImage: () => setTool("alignImage"),
    throwDie: drops.rollFromScreen,
  }));

  return (
    <EffectTooltip stageRef={stageRef}>
      <Box
        ref={sizeRef}
        pos="relative"
        h="100%"
        style={{
          cursor: cursorArrowCss(theme.colors[player.color][6]),
          // Otherwise the browser pans or zooms the page where no shape listens.
          touchAction: "none",
          backgroundImage: backgroundImage
            ? `url("${backgroundImage}")`
            : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        onMouseDown={(event) => {
          // Keeps the focus in a new text field: the browser moves it on mousedown, also after a
          // cancelled pointerdown and after a tap. Clicks into the field itself are left alone.
          const isOnMap = event.target instanceof HTMLCanvasElement;
          if (tool === "text" && isOnMap) event.preventDefault();
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
            followPointer(event);
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={endPinch}
          onTouchCancel={endPinch}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onPointerDblClick={(event) => {
            if (tool !== "select" || isLockedFinger(event)) return;
            const textId = textIdAt(event.target);
            if (textId) {
              texts.editText(textId);
              return;
            }
            // Double clicks on tokens are kept free for something else.
            if (isOnToken(event.target)) return;
            sendPing(pointerOnMap(event));
          }}
          onContextMenu={(event) => boardMenu.open(event, pointerOnMap(event))}
        >
          <Layer listening={false}>
            <MapFill />
            <MapImage showsOutside={tool === "alignImage"} />
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
            <Texts overFog={false} {...textProps} />
            <Tokens
              listening={isSelecting}
              selection={area}
              selectedIds={items.tokens}
              draggable={canDragItems}
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
            <Texts overFog {...textProps} />
          </Layer>
          <Layer>
            <FogFrame frame={fogFrame} />
            {tool === "resize" && <MapResizer />}
            {tool === "alignImage" && <MapImageAligner />}
            {isSelecting && reshapableId && (
              <ShapeResizer strokeId={reshapableId} draggable={canDragItems} />
            )}
            <SelectionFrame
              area={area}
              draggable={canDragItems}
              onMove={selection.moveArea}
            />
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
          canAlignMapImage={canAlignMapImage}
          activeColor={color}
          onColorChange={setColor}
          textSize={textSize}
          onTextSizeChange={setTextSize}
        />
      </Box>
    </EffectTooltip>
  );
}
