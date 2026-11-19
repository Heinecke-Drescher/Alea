import { Grayscale } from "konva/lib/filters/Grayscale";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Image as ImageNode } from "konva/lib/shapes/Image";
import { useEffect, useRef } from "react";
import { Group, Image } from "react-konva";
import useImage from "use-image";
import { isOutOfFight, tokenEffects } from "../../room/effects";
import { tokenMarks } from "../../room/marks";
import type { Token } from "../../room/roomStore";
import { CELL_SIZE } from "../../room/grid";
import { rimmedImageBox } from "../../tokens/tokenRim";
import { BrokenTokenImage } from "./BrokenTokenImage";
import { SelectionRing, SelectionTint } from "./SelectionRing";
import { TokenGrip } from "./TokenGrip";
import { TokenRim } from "./TokenRim";
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
  const imageBox = rimmedImageBox(size);
  const effects = tokenEffects(token);
  const isGray = isOutOfFight(token);

  useEffect(() => {
    if (!image) return;
    const node = imageRef.current;
    if (!node) throw new Error("Token image is not mounted");
    // Konva filters only work on cached nodes. Caching at the image's own
    // resolution keeps a zoomed-in token as sharp as without the filter.
    if (isGray) node.cache({ pixelRatio: image.width / imageBox.width });
    else node.clearCache();
  }, [image, imageBox.width, isGray]);

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
      {isHighlighted && <TokenGrip size={size} />}
      {/* The ring lies in the body, so it grows and is knocked along with the image. */}
      <Group
        name={TOKEN_BODY_NAME}
        x={size / 2}
        y={size / 2}
        offsetX={size / 2}
        offsetY={size / 2}
      >
        {isHighlighted && <SelectionRing size={size} />}
        {/* An image from a file or another player may be broken; the rest of the map keeps working. */}
        {status === "failed" ? (
          <BrokenTokenImage {...imageBox} />
        ) : (
          <Image
            ref={imageRef}
            image={image}
            {...imageBox}
            filters={isGray ? [Grayscale] : []}
          />
        )}
        <TokenRim size={size} />
        {isHighlighted && <SelectionTint size={size} />}
        <TokenBadges
          effects={effects}
          marks={tokenMarks(token)}
          tokenSize={token.size}
        />
      </Group>
      {isHighlighted && token.name && (
        <TokenNameLabel name={token.name} size={size} />
      )}
    </Group>
  );
}
