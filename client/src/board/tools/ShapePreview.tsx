import { Group } from "react-konva";
import { FEET_PER_CELL } from "../../room/grid";
import { shapeCells, shapeOutline, type AreaShape } from "../../room/shapes";
import { StrokeLine } from "../Strokes";
import { useStageZoom } from "../useStageZoom";
import { ToolLabel } from "./ToolLabel";

interface ShapePreviewProps {
  draft: AreaShape | null;
  color: string;
}

export function ShapePreview({ draft, color }: ShapePreviewProps) {
  const { groupRef, zoom } = useStageZoom();

  const points = draft && shapeOutline(draft);
  if (!draft || !points) return <Group ref={groupRef} listening={false} />;

  const feet = shapeCells(draft) * FEET_PER_CELL;

  return (
    <Group ref={groupRef} listening={false}>
      <StrokeLine color={color} points={points} closed />
      <ToolLabel
        at={draft.to}
        zoom={zoom}
        color={color}
        text={draft.kind === "circle" ? `${feet} ft radius` : `${feet} ft`}
      />
    </Group>
  );
}
