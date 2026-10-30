import { Group } from "react-konva";
import { shapeOutline, type AreaShape } from "../../room/shapes";
import { StrokeLine } from "../Strokes";
import { useStageZoom } from "../useStageZoom";
import { ShapeSizeLabel } from "./ShapeSizeLabel";

interface ShapePreviewProps {
  draft: AreaShape | null;
  color: string;
}

export function ShapePreview({ draft, color }: ShapePreviewProps) {
  const { groupRef, zoom } = useStageZoom();

  const points = draft && shapeOutline(draft);
  if (!draft || !points) return <Group ref={groupRef} listening={false} />;

  return (
    <Group ref={groupRef} listening={false}>
      <StrokeLine color={color} points={points} closed />
      <ShapeSizeLabel shape={draft} zoom={zoom} color={color} />
    </Group>
  );
}
