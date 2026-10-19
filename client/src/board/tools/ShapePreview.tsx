import { alpha } from "@mantine/core";
import { Group, Line } from "react-konva";
import { FEET_PER_CELL } from "../../room/grid";
import { shapeCells, shapeOutline } from "../../room/shapes";
import { useStageZoom } from "../useStageZoom";
import type { ShapeDraft } from "./shape";
import { ToolLabel } from "./ToolLabel";

interface ShapePreviewProps {
  draft: ShapeDraft | null;
  color: string;
}

export function ShapePreview({ draft, color }: ShapePreviewProps) {
  const { groupRef, zoom } = useStageZoom();

  const points = draft && shapeOutline(draft.kind, draft.from, draft.to);
  if (!draft || !points) return <Group ref={groupRef} listening={false} />;

  const feet = shapeCells(draft.kind, draft.from, draft.to) * FEET_PER_CELL;

  return (
    <Group ref={groupRef} listening={false}>
      <Line
        points={points}
        closed
        stroke={color}
        strokeWidth={3}
        strokeScaleEnabled={false}
        fill={alpha(color, 0.25)}
        lineJoin="round"
      />
      <ToolLabel
        at={draft.to}
        zoom={zoom}
        color={color}
        text={draft.kind === "circle" ? `${feet} ft radius` : `${feet} ft`}
      />
    </Group>
  );
}
