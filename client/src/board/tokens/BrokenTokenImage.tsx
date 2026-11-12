import { useMantineTheme } from "@mantine/core";
import { Circle, Text } from "react-konva";

interface BrokenTokenImageProps {
  x: number;
  y: number;
  width: number;
}

// Filled, so the token can still be picked, moved and deleted.
export function BrokenTokenImage({ x, y, width }: BrokenTokenImageProps) {
  const theme = useMantineTheme();
  return (
    <>
      <Circle
        x={x + width / 2}
        y={y + width / 2}
        radius={width / 2}
        fill={theme.colors.gray[6]}
      />
      <Text
        text="!"
        x={x}
        y={y}
        width={width}
        height={width}
        align="center"
        verticalAlign="middle"
        fontSize={width / 2}
        fontStyle="bold"
        fill={theme.white}
        listening={false}
      />
    </>
  );
}
