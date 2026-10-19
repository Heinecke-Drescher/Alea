import { alpha, useMantineTheme } from "@mantine/core";
import type { KonvaEventObject } from "konva/lib/Node";
import type { IRect } from "konva/lib/types";
import { Group, Line } from "react-konva";
import { isClosed, isOverFog } from "../room/drawing";
import { useRoom } from "../room/RoomContext";
import { strokeTouches } from "../room/strokeTouches";
import { useY } from "../room/useY";
import { HIGHLIGHT_OPACITY, highlightColor } from "./selection/highlight";

const STROKE_WIDTH = 4;
const HIT_WIDTH = 16;
const HIGHLIGHT_WIDTH = 14;
const SHAPE_FILL_OPACITY = 0.25;
const LINE_SHAPE = {
  tension: 0.5,
  lineCap: "round",
  lineJoin: "round",
} as const;
const OUTLINE_SHAPE = { closed: true, lineJoin: "round" } as const;

function lineShape(closed: boolean | undefined) {
  return closed ? OUTLINE_SHAPE : LINE_SHAPE;
}

interface StrokeLineProps {
  id?: string;
  color: string;
  points: number[];
  closed?: boolean;
  draggable?: boolean;
}

interface StrokesProps {
  overFog: boolean;
  draft: StrokeLineProps | null;
  selection: IRect | null;
  selectedIds: string[];
  listening: boolean;
  draggable: boolean;
  onStrokePress: (id: string, event: KonvaEventObject<MouseEvent>) => void;
  onStrokeClick: (id: string, event: KonvaEventObject<MouseEvent>) => void;
}

export function StrokeLine({
  id,
  color,
  points,
  closed,
  draggable,
}: StrokeLineProps) {
  const line = (
    <Line
      {...lineShape(closed)}
      id={id}
      points={points}
      stroke={color}
      strokeWidth={STROKE_WIDTH}
      hitStrokeWidth={HIT_WIDTH}
      draggable={draggable}
    />
  );
  if (!closed) return line;
  // Only the outline listens, so frames can still be drawn inside a large area.
  return (
    <>
      <Line
        {...OUTLINE_SHAPE}
        name={id}
        points={points}
        fill={alpha(color, SHAPE_FILL_OPACITY)}
        listening={false}
      />
      {line}
    </>
  );
}

export function Strokes({
  overFog,
  draft,
  selection,
  selectedIds,
  listening,
  draggable,
  onStrokePress,
  onStrokeClick,
}: StrokesProps) {
  const room = useRoom();
  const theme = useMantineTheme();
  const strokes = Object.values(useY(room.strokesMap)).filter(
    (stroke) => isOverFog(stroke) === overFog,
  );
  const selected = strokes.filter(
    (stroke) =>
      selectedIds.includes(stroke.id) ||
      (selection && strokeTouches(stroke, selection)),
  );
  return (
    <Group
      listening={listening}
      onMouseDown={(event) => {
        const id = event.target.id();
        if (id) onStrokePress(id, event);
      }}
      onClick={(event) => {
        const id = event.target.id();
        if (id) onStrokeClick(id, event);
      }}
    >
      {selected.map((stroke) => (
        <Line
          {...lineShape(isClosed(stroke))}
          key={`highlight-${stroke.id}`}
          name={stroke.id}
          points={stroke.points}
          stroke={highlightColor(theme)}
          strokeWidth={HIGHLIGHT_WIDTH}
          opacity={HIGHLIGHT_OPACITY}
          listening={false}
        />
      ))}
      {strokes.map((stroke) => (
        <StrokeLine
          key={stroke.id}
          id={stroke.id}
          color={stroke.color}
          points={stroke.points}
          closed={isClosed(stroke)}
          draggable={draggable}
        />
      ))}
      {draft && <StrokeLine color={draft.color} points={draft.points} />}
    </Group>
  );
}
