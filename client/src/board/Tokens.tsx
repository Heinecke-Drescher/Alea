import type { KonvaEventObject } from "konva/lib/Node";
import type { IRect } from "konva/lib/types";
import { Group } from "react-konva";
import { hasCenterIn } from "../room/areaActions";
import { embeddedImage } from "../room/tokens";
import { useRoom } from "../room/RoomContext";
import { useY } from "../room/useY";
import { TokenResizer } from "./TokenResizer";
import { TokenView } from "./TokenView";

interface TokensProps {
  listening: boolean;
  selection: IRect | null;
  selectedIds: string[];
  resizableId: string | null;
  onTokenPress: (id: string, event: KonvaEventObject<MouseEvent>) => void;
  onTokenClick: (id: string, event: KonvaEventObject<MouseEvent>) => void;
}

export function Tokens({
  listening,
  selection,
  selectedIds,
  resizableId,
  onTokenPress,
  onTokenClick,
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
  const resizable = shown.find(({ token }) => token.id === resizableId)?.token;

  return (
    <Group listening={listening}>
      {shown.map(({ token, imageDataUrl }) => (
        <TokenView
          key={token.id}
          token={token}
          imageDataUrl={imageDataUrl}
          // The resize frame marks a single selected token, and a ring would widen the frame.
          isHighlighted={
            token !== resizable &&
            (selectedIds.includes(token.id) ||
              (selection !== null &&
                hasCenterIn(selection, token.x, token.y, token.size)))
          }
          onPress={(event) => onTokenPress(token.id, event)}
          onClick={(event) => onTokenClick(token.id, event)}
        />
      ))}
      {resizable && <TokenResizer key={resizable.id} token={resizable} />}
    </Group>
  );
}
