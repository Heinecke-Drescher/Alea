import { useComputedColorScheme, useMantineTheme } from "@mantine/core";
import type { Vector2d } from "konva/lib/types";
import { Group, Label, Tag, Text } from "react-konva";

interface ToolLabelProps {
  at: Vector2d;
  zoom: number;
  color: string;
  text: string;
}

export function ToolLabel({ at, zoom, color, text }: ToolLabelProps) {
  const theme = useMantineTheme();
  const dark = useComputedColorScheme("light") === "dark";

  return (
    <Group {...at} scaleX={1 / zoom} scaleY={1 / zoom}>
      <Label x={14} y={16}>
        <Tag
          fill={dark ? theme.colors.dark[7] : theme.white}
          stroke={color}
          cornerRadius={4}
        />
        <Text
          text={text}
          fill={dark ? theme.colors.dark[0] : theme.colors.gray[9]}
          fontSize={14}
          fontStyle="bold"
          padding={6}
        />
      </Label>
    </Group>
  );
}
