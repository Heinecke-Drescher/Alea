import { useMantineTheme } from "@mantine/core";
import { Group, Text } from "react-konva";
import { useRoom } from "../../room/RoomContext";
import { validMapText } from "../../room/texts";
import { useY } from "../../room/useY";
import { TEXT_FONT_SIZE, TEXT_LINE_HEIGHT } from "./textStyle";

export function Texts({ overFog }: { overFog: boolean }) {
  const room = useRoom();
  const theme = useMantineTheme();
  const texts = Object.values(useY(room.textsMap)).flatMap((value) => {
    const text = validMapText(value);
    return text && (text.overFog === true) === overFog ? [text] : [];
  });

  return (
    <Group listening={false}>
      {texts.map((text) => (
        <Text
          key={text.id}
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
