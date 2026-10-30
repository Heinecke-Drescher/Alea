import { useMantineTheme } from "@mantine/core";
import { Grayscale } from "konva/lib/filters/Grayscale";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Image as ImageNode } from "konva/lib/shapes/Image";
import { useEffect, useRef } from "react";
import { Circle, Group, Image } from "react-konva";
import useImage from "use-image";
import { tokenEffects } from "../../room/effects";
import type { Token } from "../../room/roomStore";
import { CELL_SIZE } from "../../room/grid";
import { HIGHLIGHT_OPACITY, highlightColor } from "../selection/highlight";
import { TokenEffects } from "./TokenEffects";
import { TOKEN_BODY_NAME, TOKEN_NAME } from "./tokenNodes";

const HIGHLIGHT_RING = 10;

interface TokenViewProps {
  token: Token;
  imageDataUrl: string;
  isHighlighted: boolean;
  onPress: (event: KonvaEventObject<MouseEvent>) => void;
  onClick: (event: KonvaEventObject<MouseEvent>) => void;
  onContextMenu: (event: KonvaEventObject<MouseEvent>) => void;
}

export function TokenView({
  token,
  imageDataUrl,
  isHighlighted,
  onPress,
  onClick,
  onContextMenu,
}: TokenViewProps) {
  const theme = useMantineTheme();
  const [image, status] = useImage(imageDataUrl);
  const imageRef = useRef<ImageNode>(null);
  const size = token.size * CELL_SIZE;
  const effects = tokenEffects(token);
  const isOutOfFight = effects.length > 0;

  useEffect(() => {
    const node = imageRef.current;
    if (!node) throw new Error("Token image is not mounted");
    if (!image) return;
    // Konva filters only work on cached nodes. Caching at the image's own
    // resolution keeps a zoomed-in token as sharp as without the filter.
    if (isOutOfFight) node.cache({ pixelRatio: image.width / size });
    else node.clearCache();
  }, [image, size, isOutOfFight]);

  if (status === "failed") {
    throw new Error(`Image of token "${token.name}" could not be loaded`);
  }

  return (
    <Group
      id={token.id}
      name={TOKEN_NAME}
      x={token.x * CELL_SIZE}
      y={token.y * CELL_SIZE}
      draggable
      onMouseDown={onPress}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {isHighlighted && (
        <Circle
          x={size / 2}
          y={size / 2}
          radius={size / 2 + HIGHLIGHT_RING / 2}
          stroke={highlightColor(theme)}
          strokeWidth={HIGHLIGHT_RING}
          opacity={HIGHLIGHT_OPACITY}
          listening={false}
        />
      )}
      <Group
        name={TOKEN_BODY_NAME}
        x={size / 2}
        y={size / 2}
        offsetX={size / 2}
        offsetY={size / 2}
      >
        <Image
          ref={imageRef}
          image={image}
          width={size}
          height={size}
          cornerRadius={size / 2}
          filters={isOutOfFight ? [Grayscale] : []}
        />
        <TokenEffects effects={effects} tokenSize={token.size} />
      </Group>
    </Group>
  );
}
