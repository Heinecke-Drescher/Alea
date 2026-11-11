import { useFogGuard } from "../fog/useFogGuard";
import type { Token } from "../room/roomStore";
import { useRoom } from "../room/RoomContext";
import { useY } from "../room/useY";

// Someone may have removed it or hidden it under the fog meanwhile.
export function useShownToken(tokenId: string): Token | null {
  const room = useRoom();
  const fogGuard = useFogGuard();
  const token = useY(room.tokensMap)[tokenId];
  if (!token || fogGuard.hidesSquare(token)) return null;
  return token;
}
