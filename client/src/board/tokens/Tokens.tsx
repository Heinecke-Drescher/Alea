import type { KonvaEventObject } from "konva/lib/Node";
import type { IRect } from "konva/lib/types";
import { Group } from "react-konva";
import { hasCenterIn } from "../../room/areaActions";
import type { Token } from "../../room/roomStore";
import { embeddedImage } from "../../room/tokens";
import { useRoom } from "../../room/RoomContext";
import { useY } from "../../room/useY";
import { TokenView } from "./TokenView";

interface TokensProps {
  listening: boolean;
  selection: IRect | null;
  selectedIds: string[];
  onTokenPress: (id: string, event: KonvaEventObject<PointerEvent>) => void;
  onTokenClick: (id: string, event: KonvaEventObject<PointerEvent>) => void;
  onTokenContextMenu: (
    token: Token,
    event: KonvaEventObject<MouseEvent>,
  ) => void;
}

export function Tokens({
  listening,
  selection,
  selectedIds,
  onTokenPress,
  onTokenClick,
  onTokenContextMenu,
}: TokensProps) {
  const room = useRoom();
  const tokens = Object.values(useY(room.tokensMap));
  const images = useY(room.imagesMap);
  // A move racing a remove can bring a token back without its image, and
  // only embedded images are shown so no one can inject third-party URLs.
  const shown = tokens.flatMap((token) => {
    const imageDataUrl = embeddedImage(images[token.imageId]);
    return imageDataUrl ? [{ token, imageDataUrl }] : [];
  });

  return (
    <Group listening={listening}>
      {shown.map(({ token, imageDataUrl }) => (
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
          onContextMenu={(event) => onTokenContextMenu(token, event)}
        />
      ))}
    </Group>
  );
}
