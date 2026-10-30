import { useMantineTheme } from "@mantine/core";
import { Group, Label, Line, Tag, Text } from "react-konva";
import type { Awareness } from "../room/connection/connectRoom";
import { useCursors } from "../room/connection/useCursors";
import { CURSOR_ARROW } from "./cursorArrow";
import { useStageZoom } from "./useStageZoom";

interface CursorsProps {
  awareness: Awareness | null;
}

export function Cursors({ awareness }: CursorsProps) {
  const theme = useMantineTheme();
  const cursors = useCursors(awareness);
  const { groupRef, zoom } = useStageZoom();

  return (
    <Group ref={groupRef} listening={false}>
      {cursors.map(({ clientId, name, color: colorName, x, y }) => {
        const color = theme.colors[colorName][6];
        return (
          <Group key={clientId} x={x} y={y} scaleX={1 / zoom} scaleY={1 / zoom}>
            <Line points={CURSOR_ARROW} closed fill={color} stroke="white" />
            <Label x={14} y={16}>
              <Tag fill={color} cornerRadius={4} />
              <Text text={name} fill="white" fontSize={12} padding={4} />
            </Label>
          </Group>
        );
      })}
    </Group>
  );
}
