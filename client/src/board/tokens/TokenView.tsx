import { Grayscale } from "konva/lib/filters/Grayscale";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Image as ImageNode } from "konva/lib/shapes/Image";
import { useEffect, useRef } from "react";
import { Group, Image } from "react-konva";
import useImage from "use-image";
import { isOutOfFight, tokenEffects } from "../../room/effects";
import { tokenMark } from "../../room/mark";
import type { Token } from "../../room/roomStore";
import { CELL_SIZE } from "../../room/grid";
import { SelectionRing, SelectionTint } from "./SelectionRing";
import { TokenBadges } from "./TokenBadges";
import { TokenNameLabel } from "./TokenNameLabel";
import { TOKEN_BODY_NAME, TOKEN_NAME } from "./tokenNodes";

interface TokenViewProps {
  token: Token;
  imageDataUrl: string;
  isHighlighted: boolean;
  draggable: boolean;
  onPress: (event: KonvaEventObject<PointerEvent>) => void;
  onClick: (event: KonvaEventObject<PointerEvent>) => void;
  onContextMenu: (event: KonvaEventObject<MouseEvent>) => void;
}

export function TokenView({
  token,
  imageDataUrl,
  isHighlighted,
  draggable,
  onPress,
  onClick,
  onContextMenu,
}: TokenViewProps) {
  const [image, status] = useImage(imageDataUrl);
  const imageRef = useRef<ImageNode>(null);
  const size = token.size * CELL_SIZE;
  const effects = tokenEffects(token);
  const isGray = isOutOfFight(token);

  useEffect(() => {
    const node = imageRef.current;
    if (!node) throw new Error("Token image is not mounted");
    if (!image) return;
    // Konva filters only work on cached nodes. Caching at the image's own
    // resolution keeps a zoomed-in token as sharp as without the filter.
    if (isGray) node.cache({ pixelRatio: image.width / size });
    else node.clearCache();
  }, [image, size, isGray]);

  if (status === "failed") {
    throw new Error(`Image of token "${token.name}" could not be loaded`);
  }

  return (
    <Group
      id={token.id}
      name={TOKEN_NAME}
      x={token.x * CELL_SIZE}
      y={token.y * CELL_SIZE}
      draggable={draggable}
      onPointerDown={onPress}
      onPointerClick={onClick}
      onContextMenu={onContextMenu}
    >
      {isHighlighted && <SelectionRing size={size} />}
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
          filters={isGray ? [Grayscale] : []}
        />
        {isHighlighted && <SelectionTint size={size} />}
        <TokenBadges
          effects={effects}
          mark={tokenMark(token)}
          tokenSize={token.size}
        />
      </Group>
      {isHighlighted && token.name && (
        <TokenNameLabel name={token.name} size={size} />
      )}
    </Group>
  );
}
