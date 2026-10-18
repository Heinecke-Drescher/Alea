import { useComputedColorScheme, useMantineTheme } from "@mantine/core";
import { Group, Label, Line, Tag, Text } from "react-konva";
import { squareCenter } from "../../room/grid";
import { cellDistance, type Measurement } from "./measurement";
import { useStageZoom } from "../useStageZoom";

interface DistanceMeasureProps {
  measurement: Measurement | null;
  color: string;
}

export function DistanceMeasure({ measurement, color }: DistanceMeasureProps) {
  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme("light");
  const { groupRef, zoom } = useStageZoom();

  if (!measurement) return <Group ref={groupRef} listening={false} />;

  const from = squareCenter(measurement.from.x, measurement.from.y, 1);
  const to = squareCenter(measurement.to.x, measurement.to.y, 1);
  const cells = cellDistance(measurement);
  const rotation = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
  const dark = colorScheme === "dark";

  return (
    <Group ref={groupRef} listening={false}>
      <Line
        points={[from.x, from.y, to.x, to.y]}
        stroke={color}
        strokeWidth={3}
        strokeScaleEnabled={false}
        lineCap="round"
      />
      {[from, to].map((point, index) => (
        <Group
          key={index}
          {...point}
          rotation={rotation}
          scaleX={1 / zoom}
          scaleY={1 / zoom}
        >
          <Line
            points={[0, -6, 0, 6]}
            stroke={color}
            strokeWidth={3}
            lineCap="round"
          />
        </Group>
      ))}
      <Group {...to} scaleX={1 / zoom} scaleY={1 / zoom}>
        <Label x={14} y={16}>
          <Tag
            fill={dark ? theme.colors.dark[7] : theme.white}
            stroke={color}
            cornerRadius={4}
          />
          <Text
            text={`${cells * 5} ft · ${cells} ${cells === 1 ? "cell" : "cells"}`}
            fill={dark ? theme.colors.dark[0] : theme.colors.gray[9]}
            fontSize={14}
            fontStyle="bold"
            padding={6}
          />
        </Label>
      </Group>
    </Group>
  );
}
