import { Layer, Line } from "react-konva";
import { strokesMap } from "../room/roomDoc";
import { useY } from "../room/useY";

const STROKE_WIDTH = 4;
const HIT_WIDTH = 16;

interface StrokeLineProps {
  id?: string;
  color: string;
  points: number[];
}

interface StrokeLayerProps {
  draft: StrokeLineProps | null;
  listening: boolean;
}

function StrokeLine({ id, color, points }: StrokeLineProps) {
  return (
    <Line
      id={id}
      points={points}
      stroke={color}
      strokeWidth={STROKE_WIDTH}
      hitStrokeWidth={HIT_WIDTH}
      tension={0.5}
      lineCap="round"
      lineJoin="round"
    />
  );
}

export function StrokeLayer({ draft, listening }: StrokeLayerProps) {
  const strokes = Object.values(useY(strokesMap));

  return (
    <Layer listening={listening}>
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
