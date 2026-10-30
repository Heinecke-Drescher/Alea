import { useMantineTheme } from "@mantine/core";
import { Group, Text } from "react-konva";
import { useRoom } from "../../room/RoomContext";
import { validMapText } from "../../room/texts";
import { useY } from "../../room/useY";
import { TEXT_NAME } from "./textNodes";
import { TEXT_FONT_SIZE, TEXT_LINE_HEIGHT } from "./textStyle";

interface TextsProps {
  overFog: boolean;
  listening: boolean;
  // Hidden while its field is open, so it is not shown twice.
  editingId: string | null;
}

export function Texts({ overFog, listening, editingId }: TextsProps) {
  const room = useRoom();
  const theme = useMantineTheme();
  const texts = Object.values(useY(room.textsMap)).flatMap((value) => {
    const text = validMapText(value);
    const shown =
      text && (text.overFog === true) === overFog && text.id !== editingId;
    return shown ? [text] : [];
  });

  return (
    <Group listening={listening}>
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
          fontSize={TEXT_FONT_SIZE}
          lineHeight={TEXT_LINE_HEIGHT}
        />
      ))}
    </Group>
  );
}
