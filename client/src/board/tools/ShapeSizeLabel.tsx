import { FEET_PER_CELL } from "../../room/grid";
import { shapeCells, type AreaShape } from "../../room/shapes";
import { ToolLabel } from "./ToolLabel";

interface ShapeSizeLabelProps {
  shape: AreaShape;
  zoom: number;
  color: string;
}

export function ShapeSizeLabel({ shape, zoom, color }: ShapeSizeLabelProps) {
  const feet = shapeCells(shape) * FEET_PER_CELL;

  return (
    <ToolLabel
      at={shape.to}
      zoom={zoom}
      color={color}
      text={shape.kind === "circle" ? `${feet} ft radius` : `${feet} ft`}
    />
  );
}
