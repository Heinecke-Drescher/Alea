import { rgba, useMantineTheme } from "@mantine/core";
import type { KonvaEventObject } from "konva/lib/Node";
import type { IRect } from "konva/lib/types";
import { Group, Rect, Text } from "react-konva";
import { useRoom } from "../../room/RoomContext";
import type { MapText } from "../../room/roomStore";
import { textTouches, validMapText } from "../../room/texts";
import { useY } from "../../room/useY";
import {
  OUTLINE_EDGE_WIDTH,
  OUTLINE_WIDTH,
  useOutlineColors,
} from "../selection/highlight";
import { useStageZoom } from "../useStageZoom";
import { textIdAt, TEXT_NAME } from "./textNodes";
import { TEXT_LINE_HEIGHT } from "./textStyle";

const HIGHLIGHT_PADDING = 4;
// A tint instead of an empty box, so there is no gap whose width could look uneven.
const TINT_ALPHA = 0.15;

// The id as name lets item drags move it along with its text.
function TextOutline({ text }: { text: MapText }) {
  const { color, edge } = useOutlineColors();
  const { groupRef, zoom } = useStageZoom();
  const box = {
    width: text.width + 2 * HIGHLIGHT_PADDING,
    height: text.height + 2 * HIGHLIGHT_PADDING,
  };
  // Lines are centered on their rectangle, so the edge goes around the outer half of the outline.
  const edgeOffset = (OUTLINE_WIDTH + OUTLINE_EDGE_WIDTH) / 2 / zoom;

  return (
    <Group
      ref={groupRef}
      name={text.id}
      x={text.x - HIGHLIGHT_PADDING}
      y={text.y - HIGHLIGHT_PADDING}
      listening={false}
    >
      <Rect
        x={-edgeOffset}
        y={-edgeOffset}
        width={box.width + 2 * edgeOffset}
        height={box.height + 2 * edgeOffset}
        stroke={edge}
        strokeWidth={OUTLINE_EDGE_WIDTH}
        strokeScaleEnabled={false}
      />
      <Rect
        {...box}
        fill={rgba(color, TINT_ALPHA)}
        stroke={color}
        strokeWidth={OUTLINE_WIDTH}
        strokeScaleEnabled={false}
      />
    </Group>
  );
}

interface TextsProps {
  overFog: boolean;
  listening: boolean;
  // Hidden while its field is open, so it is not shown twice.
  editingId: string | null;
  selection: IRect | null;
  selectedIds: string[];
  draggable: boolean;
  onTextPress: (id: string, event: KonvaEventObject<PointerEvent>) => void;
  onTextClick: (id: string, event: KonvaEventObject<PointerEvent>) => void;
}

export function Texts({
  overFog,
  listening,
  editingId,
  selection,
  selectedIds,
  draggable,
  onTextPress,
  onTextClick,
}: TextsProps) {
  const room = useRoom();
  const theme = useMantineTheme();
  const texts = Object.values(useY(room.textsMap)).flatMap((value) => {
    const text = validMapText(value);
    const shown =
      text && (text.overFog === true) === overFog && text.id !== editingId;
    return shown ? [text] : [];
  });
  const selected = texts.filter(
    (text) =>
      selectedIds.includes(text.id) ||
      (selection && textTouches(text, selection)),
  );

  return (
    <Group
      listening={listening}
      onPointerDown={(event) => {
        const id = textIdAt(event.target);
        if (id) onTextPress(id, event);
      }}
      onPointerClick={(event) => {
        const id = textIdAt(event.target);
        if (id) onTextClick(id, event);
      }}
    >
      {selected.map((text) => (
        <TextOutline key={`highlight-${text.id}`} text={text} />
      ))}
      {texts.map((text) => (
        <Text
          key={text.id}
          id={text.id}
          name={TEXT_NAME}
          x={text.x}
          y={text.y}
          text={text.text}
          fill={text.color}
          fontFamily={theme.fontFamily}
          fontSize={text.fontSize}
          lineHeight={TEXT_LINE_HEIGHT}
          draggable={draggable}
        />
      ))}
    </Group>
  );
}
