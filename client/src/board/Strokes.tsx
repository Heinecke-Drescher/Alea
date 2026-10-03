import { useMantineTheme } from "@mantine/core";
import type { KonvaEventObject } from "konva/lib/Node";
import type { IRect } from "konva/lib/types";
import { Group, Line } from "react-konva";
import { useRoom } from "../room/RoomContext";
import { strokeTouches } from "../room/strokeTouches";
import { useY } from "../room/useY";
import { HIGHLIGHT_OPACITY, highlightColor } from "./highlight";

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

interface StrokesProps {
  draft: StrokeLineProps | null;
  selection: IRect | null;
  selectedIds: string[];
  listening: boolean;
  draggable: boolean;
  onStrokePress: (id: string, event: KonvaEventObject<MouseEvent>) => void;
  onStrokeClick: (id: string, event: KonvaEventObject<MouseEvent>) => void;
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

export function Strokes({
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
  const strokes = Object.values(useY(room.strokesMap));
  const selected = strokes.filter(
    (stroke) =>
      selectedIds.includes(stroke.id) ||
      (selection && strokeTouches(stroke.points, selection)),
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
          {...LINE_SHAPE}
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
          draggable={draggable}
        />
      ))}
      {draft && <StrokeLine color={draft.color} points={draft.points} />}
    </Group>
  );
}
