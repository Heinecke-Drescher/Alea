import type { IRect } from "konva/lib/types";
import { Group } from "react-konva";
import { hasCenterIn } from "../room/areaActions";
import { embeddedImage } from "../room/tokens";
import { useRoom } from "../room/RoomContext";
import { useY } from "../room/useY";
import { TokenView } from "./TokenView";

interface TokensProps {
  listening: boolean;
  selection: IRect | null;
}

export function Tokens({ listening, selection }: TokensProps) {
  const room = useRoom();
  const tokens = Object.values(useY(room.tokensMap));
  const images = useY(room.imagesMap);

  return (
    <Group listening={listening}>
      {tokens.map((token) => {
        // A move racing a remove can bring a token back without its image, and
        // only embedded images are shown so no one can inject third-party URLs.
        const imageDataUrl = embeddedImage(images[token.imageId]);
        if (!imageDataUrl) return null;
        return (
          <TokenView
            key={token.id}
            token={token}
            imageDataUrl={imageDataUrl}
            isHighlighted={
              selection !== null &&
              hasCenterIn(selection, token.x, token.y, token.size)
            }
          />
        );
      })}
    </Group>
  );
}
