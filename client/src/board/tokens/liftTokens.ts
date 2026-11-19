import Konva from "konva";
import type { Group } from "konva/lib/Group";
import type { Node } from "konva/lib/Node";
import { TOKEN_BODY_NAME, TOKEN_NAME } from "./tokenNodes";

const LIFTED = 1.1;
const LIFT_SECONDS = 0.15;

// A dragged token is picked up like a real one: it grows a little above the other tokens, and
// sinks back to its place in the stack when let go.
export function liftTokens(moved: Node[], reducesMotion: boolean) {
  const lifted = moved
    .filter(
      (node): node is Group =>
        node instanceof Konva.Group && node.hasName(TOKEN_NAME),
    )
    .map((token) => ({ token, index: token.zIndex() }))
    .sort((a, b) => a.index - b.index);
  for (const { token } of lifted) {
    token.moveToTop();
    scaleBody(token, LIFTED, reducesMotion);
  }

  function drop() {
    for (const { token, index } of lifted) {
      // Other tokens may have been removed during the drag.
      const count = token.getParent()?.getChildren().length ?? 0;
      if (count > 0) token.zIndex(Math.min(index, count - 1));
      scaleBody(token, 1, reducesMotion);
    }
  }

  return { drop };
}

function scaleBody(token: Group, scale: number, reducesMotion: boolean) {
  const body = token.findOne(`.${TOKEN_BODY_NAME}`);
  if (!body) throw new Error("Token has no body");
  if (reducesMotion) body.scale({ x: scale, y: scale });
  else
    body.to({
      scaleX: scale,
      scaleY: scale,
      duration: LIFT_SECONDS,
      easing: Konva.Easings.EaseOut,
    });
}
