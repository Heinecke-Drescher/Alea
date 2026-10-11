import { useComputedColorScheme, useMantineTheme } from "@mantine/core";
import type { Group as GroupNode } from "konva/lib/Group";
import { useLayoutEffect, useRef } from "react";
import { Group, Line, Rect, Text } from "react-konva";
import { squareCenter } from "../room/grid";
import {
  cellDistance,
  MEASUREMENT_LABEL_SIZE,
  measurementLabelPosition,
  type Measurement,
} from "./measurement";
import { useStageZoom } from "./useStageZoom";

interface DistanceMeasureProps {
  measurement: Measurement | null;
  color: string;
}

export function DistanceMeasure({ measurement, color }: DistanceMeasureProps) {
  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme("light");
  const { groupRef, zoom } = useStageZoom();
  const labelRef = useRef<GroupNode>(null);

  useLayoutEffect(() => {
    if (!measurement) return;
    const label = labelRef.current;
    const stage = label?.getStage();
    if (!label || !stage)
      throw new Error("Measurement label is not on a stage");
    const from = squareCenter(measurement.from.x, measurement.from.y, 1);
    const to = squareCenter(measurement.to.x, measurement.to.y, 1);
    const updatePosition = () => {
      label.position(
        measurementLabelPosition(
          { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 },
          {
            x: stage.x(),
            y: stage.y(),
            zoom: stage.scaleX(),
            width: stage.width(),
            height: stage.height(),
          },
        ),
      );
    };
    const events = "xChange yChange scaleXChange widthChange heightChange";
    updatePosition();
    stage.on(events, updatePosition);
    return () => {
      stage.off(events, updatePosition);
    };
  }, [measurement]);

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
      <Group ref={labelRef} scaleX={1 / zoom} scaleY={1 / zoom}>
        <Rect
          {...MEASUREMENT_LABEL_SIZE}
          fill={dark ? theme.colors.dark[7] : theme.white}
          stroke={color}
          strokeWidth={1}
          cornerRadius={8}
        />
        <Text
          y={10}
          width={MEASUREMENT_LABEL_SIZE.width}
          align="center"
          text={`${cells * 5} ft`}
          fill={dark ? theme.colors.dark[0] : theme.colors.gray[9]}
          fontSize={20}
          fontStyle="bold"
        />
        <Text
          y={38}
          width={MEASUREMENT_LABEL_SIZE.width}
          align="center"
          text={`${cells} ${cells === 1 ? "cell" : "cells"}`}
          fill={dark ? theme.colors.dark[2] : theme.colors.gray[7]}
          fontSize={13}
        />
      </Group>
    </Group>
  );
}
