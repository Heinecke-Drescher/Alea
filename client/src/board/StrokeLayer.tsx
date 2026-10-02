import { useMantineTheme } from "@mantine/core";
import type { KonvaEventObject, Node } from "konva/lib/Node";
import type { IRect } from "konva/lib/types";
import { useRef } from "react";
import { Layer, Line } from "react-konva";
import { useRoom } from "../room/RoomContext";
import { strokeTouches } from "../room/strokeTouches";
import { useY } from "../room/useY";

const STROKE_WIDTH = 4;
const HIT_WIDTH = 16;
const HIGHLIGHT_WIDTH = 14;
const LINE_SHAPE = {
  tension: 0.5,
  lineCap: "round",
  lineJoin: "round",
} as const;

interface StrokeLineProps {
  id?: string;
  color: string;
  points: number[];
  draggable?: boolean;
}

interface StrokeLayerProps {
  draft: StrokeLineProps | null;
  selection: IRect | null;
  selectedIds: string[];
  listening: boolean;
  draggable: boolean;
  onStrokePress: (id: string, event: KonvaEventObject<MouseEvent>) => void;
  onStrokeClick: (id: string, event: KonvaEventObject<MouseEvent>) => void;
  onStrokesMove: (ids: string[], dx: number, dy: number) => void;
}

function StrokeLine({ id, color, points, draggable }: StrokeLineProps) {
  return (
    <Line
      {...LINE_SHAPE}
      id={id}
      points={points}
      stroke={color}
      strokeWidth={STROKE_WIDTH}
      hitStrokeWidth={HIT_WIDTH}
      draggable={draggable}
    />
  );
}

export function StrokeLayer({
  draft,
  selection,
  selectedIds,
  listening,
  draggable,
  onStrokePress,
  onStrokeClick,
  onStrokesMove,
}: StrokeLayerProps) {
  const room = useRoom();
  const theme = useMantineTheme();
  const strokes = Object.values(useY(room.strokesMap));
  const selected = strokes.filter(
    (stroke) =>
      selectedIds.includes(stroke.id) ||
      (selection && strokeTouches(stroke.points, selection)),
  );
  const draggedIds = useRef<string[]>([]);

  // Moves the other dragged strokes and their highlights in Konva only, so React does not re-render during the drag.
  function draggedNodes(event: KonvaEventObject<DragEvent>) {
    const layer = event.target.getLayer();
    if (!layer) throw new Error("Dragged stroke is not on a layer");
    const ids = new Set(draggedIds.current);
    return layer.find(
      (node: Node) => ids.has(node.id()) || ids.has(node.name()),
    );
  }

  return (
    <Layer
      listening={listening}
      onMouseDown={(event) => {
        const id = event.target.id();
        if (id) onStrokePress(id, event);
      }}
      onClick={(event) => {
        const id = event.target.id();
        if (id) onStrokeClick(id, event);
      }}
      onDragStart={(event) => {
        const id = event.target.id();
        draggedIds.current = selectedIds.includes(id) ? selectedIds : [id];
      }}
      onDragMove={(event) => {
        const position = event.target.position();
        for (const node of draggedNodes(event)) node.position(position);
      }}
      onDragEnd={(event) => {
        const { x, y } = event.target.position();
        for (const node of draggedNodes(event)) node.position({ x: 0, y: 0 });
        onStrokesMove(draggedIds.current, x, y);
      }}
    >
      {selected.map((stroke) => (
        <Line
          {...LINE_SHAPE}
          key={`highlight-${stroke.id}`}
          name={stroke.id}
          points={stroke.points}
          stroke={theme.colors.blue[6]}
          strokeWidth={HIGHLIGHT_WIDTH}
          opacity={0.4}
          listening={false}
        />
      ))}
      {strokes.map((stroke) => (
        <StrokeLine
          key={stroke.id}
          id={stroke.id}
          color={stroke.color}
          points={stroke.points}
          draggable={draggable}
        />
      ))}
      {draft && <StrokeLine color={draft.color} points={draft.points} />}
    </Layer>
  );
}
