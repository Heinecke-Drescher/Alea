import { alpha } from "@mantine/core";
import type { KonvaEventObject } from "konva/lib/Node";
import type { IRect } from "konva/lib/types";
import { Group, Line } from "react-konva";
import { isClosed, isOverFog } from "../room/drawing";
import { useRoom } from "../room/RoomContext";
import { strokeTouches } from "../room/strokeTouches";
import { useY } from "../room/useY";
import {
  OUTLINE_OUTSIDE,
  OUTLINE_WIDTH,
  useOutlineColors,
} from "./selection/highlight";
import { useStageZoom } from "./useStageZoom";

const STROKE_WIDTH = 4;
const HIT_WIDTH = 16;
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
  onStrokePress: (id: string, event: KonvaEventObject<PointerEvent>) => void;
  onStrokeClick: (id: string, event: KonvaEventObject<PointerEvent>) => void;
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

// Drawn under the stroke and as wide as it plus the outline on both sides, so it touches it.
// The id as name lets item drags move it along with its stroke.
function StrokeOutline({
  id,
  points,
  closed,
}: {
  id: string;
  points: number[];
  closed: boolean | undefined;
}) {
  const { color, edge } = useOutlineColors();
  const { groupRef, zoom } = useStageZoom();
  const line = { ...lineShape(closed), points };

  return (
    <Group ref={groupRef} name={id} listening={false}>
      <Line
        {...line}
        stroke={edge}
        strokeWidth={STROKE_WIDTH + (2 * OUTLINE_OUTSIDE) / zoom}
      />
      <Line
        {...line}
        stroke={color}
        strokeWidth={STROKE_WIDTH + (2 * OUTLINE_WIDTH) / zoom}
      />
    </Group>
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
      onPointerDown={(event) => {
        const id = event.target.id();
        if (id) onStrokePress(id, event);
      }}
      onPointerClick={(event) => {
        const id = event.target.id();
        if (id) onStrokeClick(id, event);
      }}
    >
      {selected.map((stroke) => (
        <StrokeOutline
          key={`highlight-${stroke.id}`}
          id={stroke.id}
          points={stroke.points}
          closed={isClosed(stroke)}
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
