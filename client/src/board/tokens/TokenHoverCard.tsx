import { FloatingPanel } from "../../FloatingPanel";
import { DETAIL_WIDTH, TokenDetailContent } from "../../tokens/TokenDetail";
import { useShownToken } from "../../tokens/useShownToken";
import { hoverCardPlacement } from "./hoverCardPlacement";
import type { HoveredToken } from "./useTokenHover";

interface TokenHoverCardProps {
  hovered: HoveredToken;
  // The part of the stage that no panel covers.
  view: { width: number; height: number };
}

export function TokenHoverCard({ hovered, view }: TokenHoverCardProps) {
  const token = useShownToken(hovered.id);
  if (!token) return null;
  const { maxHeight, ...place } = hoverCardPlacement(
    hovered.rect,
    view,
    DETAIL_WIDTH,
  );
  return (
    <FloatingPanel
      pos="absolute"
      w={DETAIL_WIDTH}
      mah={maxHeight}
      p="sm"
      {...place}
      // It only shows; the mouse goes on to the map beneath it.
      style={{ overflow: "hidden", pointerEvents: "none" }}
    >
      <TokenDetailContent token={token} />
    </FloatingPanel>
  );
}
