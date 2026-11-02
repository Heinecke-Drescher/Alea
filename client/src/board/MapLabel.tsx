import { useComputedColorScheme, useMantineTheme } from "@mantine/core";
import type { Vector2d } from "konva/lib/types";
import { Group, Label, Tag, Text } from "react-konva";
import { labelPlace } from "./labelPlace";

interface MapLabelProps {
  at: Vector2d;
  // The other end of the line, where the pointer is and a finger would cover the label.
  awayFrom: Vector2d;
  // In map pixels, so the label can keep clear of what lies at `at`.
  gap: number;
  zoom: number;
  color: string;
  text: string;
}

export function MapLabel({
  at,
  awayFrom,
  gap,
  zoom,
  color,
  text,
}: MapLabelProps) {
  const theme = useMantineTheme();
  const dark = useComputedColorScheme("light") === "dark";
  const { pointer, x, y } = labelPlace(at, awayFrom, gap);

  return (
    <Group x={x} y={y} scaleX={1 / zoom} scaleY={1 / zoom}>
      <Label>
        <Tag
          fill={dark ? theme.colors.dark[7] : theme.white}
          stroke={color}
          cornerRadius={4}
          pointerDirection={pointer}
          pointerWidth={10}
          pointerHeight={8}
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
