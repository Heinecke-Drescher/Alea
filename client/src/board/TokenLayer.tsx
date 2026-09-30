import { Layer } from "react-konva";
import { useRoom } from "../room/RoomContext";
import { useY } from "../room/useY";
import { TokenView } from "./TokenView";

interface TokenLayerProps {
  listening: boolean;
}

export function TokenLayer({ listening }: TokenLayerProps) {
  const room = useRoom();
  const tokens = Object.values(useY(room.tokensMap));
  const images = useY(room.imagesMap);

  return (
    <Layer listening={listening}>
      {tokens.map((token) => {
        const imageDataUrl = images[token.imageId];
        // A move that races with a remove can bring the token back without its image.
        if (!imageDataUrl) return null;
        return (
          <TokenView key={token.id} token={token} imageDataUrl={imageDataUrl} />
        );
      })}
    </Layer>
  );
}
