import Konva from "konva";
import type { Group } from "konva/lib/Group";
import type { Node } from "konva/lib/Node";
import { TOKEN_BODY_NAME, TOKEN_NAME } from "./tokenNodes";

const LIFTED = 1.1;
const LIFT_SECONDS = 0.15;

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
      const parent = token.getParent();
      // Another player may have removed the token during the drag.
      if (!parent) continue;
      token.zIndex(Math.min(index, parent.getChildren().length - 1));
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
