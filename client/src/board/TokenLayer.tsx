import { Layer } from "react-konva";
import { imagesMap, tokensMap } from "../room/roomDoc";
import { useY } from "../room/useY";
import { TokenView } from "./TokenView";

interface TokenLayerProps {
  listening: boolean;
}

export function TokenLayer({ listening }: TokenLayerProps) {
  const tokens = Object.values(useY(tokensMap));
  const images = useY(imagesMap);

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
