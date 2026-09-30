import { Layer } from "react-konva";
import { embeddedImage } from "../room/createRoom";
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
        // A move racing a remove can bring a token back without its image, and
        // only embedded images are shown so no one can inject third-party URLs.
        const imageDataUrl = embeddedImage(images[token.imageId]);
        if (!imageDataUrl) return null;
        return (
          <TokenView key={token.id} token={token} imageDataUrl={imageDataUrl} />
        );
      })}
    </Layer>
  );
}
