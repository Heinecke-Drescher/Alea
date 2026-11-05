import { rgba } from "@mantine/core";
import { Rect } from "react-konva";
import { useOutlineColors } from "./highlight";

interface DashedFrameProps {
  width: number;
  height: number;
}

export function DashedFrame(size: DashedFrameProps) {
  const { color, edge } = useOutlineColors();

  return (
    <>
      {/* The edge fills the gaps between the dashes. */}
      <Rect
        {...size}
        stroke={edge}
        strokeWidth={4}
        strokeScaleEnabled={false}
        listening={false}
      />
      <Rect
        {...size}
        fill={rgba(color, 0.06)}
        stroke={color}
        strokeWidth={2}
        dash={[6, 4]}
        strokeScaleEnabled={false}
      />
    </>
  );
}
