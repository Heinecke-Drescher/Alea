import { clamp } from "@mantine/hooks";
import type { KonvaEventObject } from "konva/lib/Node";
import { Group, Image } from "react-konva";
import useImage from "use-image";
import { moveToken, type Token } from "../room/roomDoc";
import { CELL_SIZE, COLUMNS, ROWS } from "./grid";

interface TokenViewProps {
  token: Token;
  imageDataUrl: string;
}

function snapToGrid(event: KonvaEventObject<DragEvent>, token: Token) {
  const node = event.target;
  const x = clamp(Math.round(node.x() / CELL_SIZE), 0, COLUMNS - token.size);
  const y = clamp(Math.round(node.y() / CELL_SIZE), 0, ROWS - token.size);
  node.position({ x: x * CELL_SIZE, y: y * CELL_SIZE });
  moveToken(token.id, x, y);
}

export function TokenView({ token, imageDataUrl }: TokenViewProps) {
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
      onDragEnd={(event) => snapToGrid(event, token)}
    >
      <Image image={image} width={size} height={size} cornerRadius={size / 2} />
    </Group>
  );
}
