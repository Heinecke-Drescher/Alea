import type { Group as GroupNode } from "konva/lib/Group";
import type { Ref } from "react";
import { Group, Image } from "react-konva";
import useImage from "use-image";
import type { Clip } from "../../room/areaActions";
import { CELL_SIZE } from "../../room/grid";
import { TokenRim } from "./TokenRim";

const PREVIEW_OPACITY = 0.5;

interface HeldTokensPreviewProps {
  clip: Clip;
  // Moved to where the tokens would land, without rendering, as it follows every mouse move.
  ref: Ref<GroupNode>;
}

export function HeldTokensPreview({ clip, ref }: HeldTokensPreviewProps) {
  return (
    <Group
      ref={ref}
      visible={false}
      opacity={PREVIEW_OPACITY}
      listening={false}
    >
      {clip.tokens.map((token, i) => (
        <PreviewToken key={i} x={token.x} y={token.y} image={token.image} />
      ))}
    </Group>
  );
}

function PreviewToken({
  x,
  y,
  image,
}: {
  x: number;
  y: number;
  image: string;
}) {
  const [element] = useImage(image);
  return (
    <Group x={x * CELL_SIZE} y={y * CELL_SIZE}>
      <Image
        image={element}
        width={CELL_SIZE}
        height={CELL_SIZE}
        cornerRadius={CELL_SIZE / 2}
      />
      <TokenRim size={CELL_SIZE} />
    </Group>
  );
}
