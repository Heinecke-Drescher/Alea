import { useMantineTheme } from "@mantine/core";
import { useState } from "react";
import { Circle, Group } from "react-konva";
import { useFogGuard } from "../../fog/useFogGuard";
import { isOverFog } from "../../room/drawing";
import type { Stroke } from "../../room/roomStore";
import { useRoom } from "../../room/RoomContext";
import { shapeOutline, type AreaShape } from "../../room/shapes";
import { useY } from "../../room/useY";
import { ShapePreview } from "../tools/ShapePreview";
import { useStageZoom } from "../useStageZoom";
import { highlightColor } from "./highlight";

const HANDLE_RADIUS = 7;

interface ShapeResizerProps {
  strokeId: string;
}

export function ShapeResizer({ strokeId }: ShapeResizerProps) {
  const room = useRoom();
  const theme = useMantineTheme();
  const strokes = useY(room.strokesMap);
  const fogGuard = useFogGuard();
  const { groupRef, zoom } = useStageZoom();
  const [draft, setDraft] = useState<AreaShape | null>(null);
  const stroke = strokes[strokeId];
  const shape = stroke?.shape;

  // Players' strokes lie above the fog, so only the DM's are kept out of it.
  function reachesFog(target: Stroke, points: number[]) {
    return !isOverFog(target) && fogGuard.hidesPoints(points);
  }

  if (!stroke || !shape || reachesFog(stroke, [shape.to.x, shape.to.y])) {
    return <Group ref={groupRef} />;
  }

  return (
    <Group ref={groupRef}>
      <ShapePreview draft={draft} color={stroke.color} />
      {/* The name lets item drags move the handle along with its shape. */}
      <Circle
        {...shape.to}
        name={strokeId}
        radius={HANDLE_RADIUS / zoom}
        fill={theme.white}
        stroke={highlightColor(theme)}
        strokeWidth={2 / zoom}
        draggable
        onDragMove={(event) =>
          setDraft({ ...shape, to: event.target.position() })
        }
        onDragEnd={(event) => {
          const to = event.target.position();
          // React draws the handle from the room data, so the node goes back first.
          event.target.position(shape.to);
          setDraft(null);
          // Another player may have removed the shape in the meantime.
          const current = room.strokesMap.get(strokeId);
          if (!current?.shape) return;
          const outline = shapeOutline({ ...current.shape, to });
          if (!outline || reachesFog(current, outline)) return;
          room.reshapeStroke(strokeId, to);
        }}
      />
    </Group>
  );
}
