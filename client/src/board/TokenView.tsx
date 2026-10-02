import { clamp } from "@mantine/hooks";
import type { KonvaEventObject } from "konva/lib/Node";
import { Group, Image } from "react-konva";
import useImage from "use-image";
import type { Token } from "../room/roomStore";
import { useRoom } from "../room/RoomContext";
import { CELL_SIZE, type MapBounds } from "./grid";

interface TokenViewProps {
  token: Token;
  imageDataUrl: string;
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

export function TokenView({ token, imageDataUrl }: TokenViewProps) {
  const room = useRoom();
  const [image, status] = useImage(imageDataUrl);
  if (status === "failed") {
    throw new Error(`Image of token "${token.name}" could not be loaded`);
  }
  const size = token.size * CELL_SIZE;

  return (
    <Group
      x={token.x * CELL_SIZE}
      y={token.y * CELL_SIZE}
      draggable
      onDragEnd={(event) => {
        const { x, y } = snapToGrid(event, token, room.mapBounds());
        room.moveToken(token.id, x, y);
      }}
    >
      <Image image={image} width={size} height={size} cornerRadius={size / 2} />
    </Group>
  );
}
