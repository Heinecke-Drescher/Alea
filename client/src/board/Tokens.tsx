import type { KonvaEventObject } from "konva/lib/Node";
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
  selectedIds: string[];
  onTokenPress: (id: string, event: KonvaEventObject<MouseEvent>) => void;
  onTokenClick: (id: string, event: KonvaEventObject<MouseEvent>) => void;
}

export function Tokens({
  listening,
  selection,
  selectedIds,
  onTokenPress,
  onTokenClick,
}: TokensProps) {
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
              selectedIds.includes(token.id) ||
              (selection !== null &&
                hasCenterIn(selection, token.x, token.y, token.size))
            }
            onPress={(event) => onTokenPress(token.id, event)}
            onClick={(event) => onTokenClick(token.id, event)}
          />
        );
      })}
    </Group>
  );
}
