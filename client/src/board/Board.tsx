import { Box, useMantineTheme } from "@mantine/core";
import { useElementSize, useHotkeys } from "@mantine/hooks";
import type { Stage as StageNode } from "konva/lib/Stage";
import type { Vector2d } from "konva/lib/types";
import {
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type Ref,
} from "react";
import { Layer, Stage } from "react-konva";
import type { Critical } from "../dice/criticalRoll";
import type { ScreenSample } from "../dice/throwDie";
import type { DieSides } from "../room/dice";
import { useCanAlignMapImage } from "../mapImage/useCanSetMapImage";
import { usePlayer } from "../player/PlayerContext";
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
import { itemsSelection, reshapableStrokeId } from "./selection/selection";
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
import { pointerOnMap } from "./pointer";
import { useBoardInput } from "./useBoardInput";
import { useBoardView } from "./useBoardView";
import { useCursorBroadcast } from "./useCursorBroadcast";
import { useFitOnNewMap } from "./useFitOnNewMap";
import { usePingBroadcast } from "./usePingBroadcast";
import { useBoardDrops } from "./useBoardDrops";
import { useDieDrop } from "./useDieDrop";
import { ViewControls } from "./ViewControls";

export interface BoardHandle {
  focusToken: (id: string) => void;
  openTokenMenu: (id: string, event: ReactMouseEvent) => void;
  alignMapImage: () => void;
  throwDie: (sides: DieSides, samples: ScreenSample[]) => void;
}

interface BoardProps {
  awareness: Awareness | null;
  isSynced: boolean;
  critical: Critical | null;
  onCriticalDone: (id: string) => void;
  onSelectedTokensChange: (ids: readonly string[]) => void;
  // Width of the panels over the right edge of the board, which a fitted map keeps clear of.
  coveredRight: number;
  ref: Ref<BoardHandle>;
}

export function Board({
  awareness,
  isSynced,
  critical,
  onCriticalDone,
  onSelectedTokensChange,
  coveredRight,
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
  } = useBoardView(room, stageRef, coveredRight);
  const cursor = useCursorBroadcast(awareness);
  const isSelecting = activeTool.selectsItems;
  const input = useBoardInput({
    activeTool,
    isSelecting,
    selection,
    cursor,
    pinch,
    endPinch,
  });
  const clipboard = useClipboard({
    room,
    selection,
    pointer: input.lastPointer,
    onPaste: () => changeTool("select"),
  });
  const tokenMenu = useTokenMenu(room, selection, clipboard);
  const boardMenu = useBoardMenu(selection, clipboard);
  const sendPing = usePingBroadcast(awareness);
  const drops = useBoardDrops(stageRef, selectToken);
  const dieDrop = useDieDrop({ stageRef });
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
        input.dropTool();
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

  const textProps = {
    listening: activeTool.listensToDrawings || tool === "text",
    editingId: texts.textDraft?.id ?? null,
    selection: area,
    selectedIds: items.texts,
    draggable: isSelecting && input.canDragItems,
    onTextPress: input.pressItem("texts"),
    onTextClick: input.clickItem("texts"),
  };

  const draft = draftPoints && { color: colorValue, points: draftPoints };
  const strokeProps = {
    selection: area,
    selectedIds: items.strokes,
    listening: activeTool.listensToDrawings,
    draggable: isSelecting && input.canDragItems,
    onStrokePress: input.pressItem("strokes"),
    onStrokeClick: input.clickItem("strokes"),
  };

  function changeTool(nextTool: Tool) {
    input.endTool();
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

  function openTokenMenu(id: string, event: ReactMouseEvent) {
    const token = room.tokensMap.get(id);
    if (!token) return;
    changeTool("select");
    tokenMenu.openAt(token, event);
  }

  useImperativeHandle(ref, () => ({
    focusToken,
    openTokenMenu,
    alignMapImage: () => setTool("alignImage"),
    throwDie: dieDrop.rollFromScreen,
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
            input.followPointer(event);
          }}
          {...input.stageHandlers}
          onPointerDblClick={(event) => {
            if (tool !== "select" || input.isLockedFinger(event)) return;
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
              draggable={input.canDragItems}
              onTokenPress={input.pressItem("tokens")}
              onTokenClick={input.clickItem("tokens")}
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
              <ShapeResizer
                strokeId={reshapableId}
                draggable={input.canDragItems}
              />
            )}
            <SelectionFrame
              area={area}
              draggable={input.canDragItems}
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
