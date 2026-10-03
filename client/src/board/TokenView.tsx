import { useMantineTheme } from "@mantine/core";
import { clamp } from "@mantine/hooks";
import type { KonvaEventObject } from "konva/lib/Node";
import { Circle, Group, Image } from "react-konva";
import useImage from "use-image";
import type { Token } from "../room/roomStore";
import { useRoom } from "../room/RoomContext";
import { CELL_SIZE, type MapBounds } from "../room/grid";
import { HIGHLIGHT_OPACITY, highlightColor } from "./highlight";

const HIGHLIGHT_RING = 10;

interface TokenViewProps {
  token: Token;
  imageDataUrl: string;
  isHighlighted: boolean;
}

function snapToGrid(
  event: KonvaEventObject<DragEvent>,
  token: Token,
  map: MapBounds,
) {
  const node = event.target;
  const snap = (value: number, start: number, cells: number) =>
    clamp(Math.round(value / CELL_SIZE), start, start + cells - token.size);
  const x = snap(node.x(), map.x, map.columns);
  const y = snap(node.y(), map.y, map.rows);
  node.position({ x: x * CELL_SIZE, y: y * CELL_SIZE });
  return { x, y };
}

export function TokenView({
  token,
  imageDataUrl,
  isHighlighted,
}: TokenViewProps) {
  const room = useRoom();
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
      onDragEnd={(event) => {
        const { x, y } = snapToGrid(event, token, room.mapBounds());
        room.moveToken(token.id, x, y);
      }}
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
