import { useMantineTheme } from "@mantine/core";
import type { KonvaEventObject } from "konva/lib/Node";
import { Circle, Group, Image } from "react-konva";
import useImage from "use-image";
import type { Token } from "../room/roomStore";
import { CELL_SIZE } from "../room/grid";
import { HIGHLIGHT_OPACITY, highlightColor } from "./highlight";

const HIGHLIGHT_RING = 10;

interface TokenViewProps {
  token: Token;
  imageDataUrl: string;
  isHighlighted: boolean;
  onPress: (event: KonvaEventObject<MouseEvent>) => void;
  onClick: (event: KonvaEventObject<MouseEvent>) => void;
}

export function TokenView({
  token,
  imageDataUrl,
  isHighlighted,
  onPress,
  onClick,
}: TokenViewProps) {
  const theme = useMantineTheme();
  const [image, status] = useImage(imageDataUrl);
  if (status === "failed") {
    throw new Error(`Image of token "${token.name}" could not be loaded`);
  }
  const size = token.size * CELL_SIZE;

  return (
    <Group
      id={token.id}
      x={token.x * CELL_SIZE}
      y={token.y * CELL_SIZE}
      draggable
      onMouseDown={onPress}
      onClick={onClick}
    >
      {isHighlighted && (
        <Circle
          x={size / 2}
          y={size / 2}
          radius={size / 2 + HIGHLIGHT_RING / 2}
          stroke={highlightColor(theme)}
          strokeWidth={HIGHLIGHT_RING}
          opacity={HIGHLIGHT_OPACITY}
          listening={false}
        />
      )}
      <Image
        image={image}
        x={size / 2}
        y={size / 2}
        offsetX={size / 2}
        offsetY={size / 2}
        width={size}
        height={size}
        cornerRadius={size / 2}
      />
    </Group>
  );
}
