import { useMantineTheme } from "@mantine/core";
import type { KonvaEventObject } from "konva/lib/Node";
import type { IRect } from "konva/lib/types";
import { Group, Rect, Text } from "react-konva";
import { useRoom } from "../../room/RoomContext";
import { textFontSize, textTouches, validMapText } from "../../room/texts";
import { useY } from "../../room/useY";
import { HIGHLIGHT_OPACITY, highlightColor } from "../selection/highlight";
import { textIdAt, TEXT_NAME } from "./textNodes";
import { TEXT_LINE_HEIGHT } from "./textStyle";

const HIGHLIGHT_PADDING = 4;

interface TextsProps {
  overFog: boolean;
  listening: boolean;
  // Hidden while its field is open, so it is not shown twice.
  editingId: string | null;
  selection: IRect | null;
  selectedIds: string[];
  draggable: boolean;
  onTextPress: (id: string, event: KonvaEventObject<MouseEvent>) => void;
  onTextClick: (id: string, event: KonvaEventObject<MouseEvent>) => void;
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
      onMouseDown={(event) => {
        const id = textIdAt(event.target);
        if (id) onTextPress(id, event);
      }}
      onClick={(event) => {
        const id = textIdAt(event.target);
        if (id) onTextClick(id, event);
      }}
    >
      {/* The id as name lets item drags move the frame along with its text. */}
      {selected.map((text) => (
        <Rect
          key={`highlight-${text.id}`}
          name={text.id}
          x={text.x - HIGHLIGHT_PADDING}
          y={text.y - HIGHLIGHT_PADDING}
          width={text.width + 2 * HIGHLIGHT_PADDING}
          height={text.height + 2 * HIGHLIGHT_PADDING}
          stroke={highlightColor(theme)}
          strokeWidth={2}
          opacity={HIGHLIGHT_OPACITY * 2}
          listening={false}
        />
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
          fontSize={textFontSize(text)}
          lineHeight={TEXT_LINE_HEIGHT}
          draggable={draggable}
        />
      ))}
    </Group>
  );
}
