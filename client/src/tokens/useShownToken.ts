import { useFogGuard } from "../fog/useFogGuard";
import type { Token } from "../room/roomStore";
import { useToken } from "../room/useTokens";

// Someone may have removed it or hidden it under the fog meanwhile.
export function useShownToken(tokenId: string): Token | null {
  const fogGuard = useFogGuard();
  const token = useToken(tokenId);
  if (!token || fogGuard.hidesSquare(token)) return null;
  return token;
}
