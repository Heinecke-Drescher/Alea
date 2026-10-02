import { useMantineTheme } from "@mantine/core";
import type { Group as GroupNode } from "konva/lib/Group";
import { useEffect, useRef, useState } from "react";
import { Group, Label, Line, Tag, Text } from "react-konva";
import type { Awareness } from "../room/connectRoom";
import { useCursors } from "../room/useCursors";
import { PAINT_COLORS, paintColorValue } from "./paintColors";

const ARROW = [0, 0, 0, 18, 5, 13, 13, 13];

interface CursorsProps {
  awareness: Awareness | null;
}

export function Cursors({ awareness }: CursorsProps) {
  const theme = useMantineTheme();
  const cursors = useCursors(awareness);
  const groupRef = useRef<GroupNode>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const stage = groupRef.current?.getStage();
    if (!stage) throw new Error("Cursors are not on a stage");
    const updateZoom = () => setZoom(stage.scaleX());
    stage.on("scaleXChange", updateZoom);
    return () => {
      stage.off("scaleXChange", updateZoom);
    };
  }, []);

  return (
    <Group ref={groupRef} listening={false}>
      {cursors.map(({ clientId, name, x, y }) => {
        const colorName = PAINT_COLORS[clientId % PAINT_COLORS.length];
        if (!colorName) throw new Error(`No cursor color for ${clientId}`);
        const color = paintColorValue(theme, colorName);
        return (
          <Group key={clientId} x={x} y={y} scaleX={1 / zoom} scaleY={1 / zoom}>
            <Line points={ARROW} closed fill={color} stroke="white" />
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
