import { useMantineTheme } from "@mantine/core";
import type { IRect } from "konva/lib/types";
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
}

interface StrokeLayerProps {
  draft: StrokeLineProps | null;
  selection: IRect | null;
  listening: boolean;
}

function StrokeLine({ id, color, points }: StrokeLineProps) {
  return (
    <Line
      {...LINE_SHAPE}
      id={id}
      points={points}
      stroke={color}
      strokeWidth={STROKE_WIDTH}
      hitStrokeWidth={HIT_WIDTH}
    />
  );
}

export function StrokeLayer({ draft, selection, listening }: StrokeLayerProps) {
  const room = useRoom();
  const theme = useMantineTheme();
  const strokes = Object.values(useY(room.strokesMap));
  const selected = selection
    ? strokes.filter((stroke) => strokeTouches(stroke.points, selection))
    : [];

  return (
    <Layer listening={listening}>
      {selected.map((stroke) => (
        <Line
          {...LINE_SHAPE}
          key={`highlight-${stroke.id}`}
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
        />
      ))}
      {draft && <StrokeLine color={draft.color} points={draft.points} />}
    </Layer>
  );
}
