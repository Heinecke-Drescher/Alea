import { Circle } from "react-konva";
import { TOKEN_SHADOW_NAME } from "./tokenNodes";

const SHADOW_ALPHA = 0.35;

// Shown by liftTokens while the token is dragged. A soft gradient below the token instead of
// Konva's shadow blur, which costs far more on every frame of a drag.
export function LiftShadow({ size }: { size: number }) {
  const middle = size / 2;
  const radius = middle * 1.15;
  return (
    <Circle
      name={TOKEN_SHADOW_NAME}
      x={middle}
      y={middle + size * 0.1}
      radius={radius}
      fillRadialGradientStartRadius={0}
      fillRadialGradientEndRadius={radius}
      fillRadialGradientColorStops={[
        0.6,
        `rgba(0, 0, 0, ${SHADOW_ALPHA})`,
        1,
        "rgba(0, 0, 0, 0)",
      ]}
      opacity={0}
      visible={false}
      listening={false}
    />
  );
}
