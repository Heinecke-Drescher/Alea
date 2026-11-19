import Konva from "konva";
import type { Group } from "konva/lib/Group";
import type { Node } from "konva/lib/Node";
import { TOKEN_BODY_NAME, TOKEN_NAME, TOKEN_SHADOW_NAME } from "./tokenNodes";

const LIFTED = 1.1;
const LIFT_SECONDS = 0.15;

// A dragged token is picked up like a real one: it grows a little and casts a shadow above the
// other tokens, and sinks back to its place in the stack when let go.
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
    setLift(token, true, reducesMotion);
  }

  function drop() {
    for (const { token, index } of lifted) {
      // Other tokens may have been removed during the drag.
      const count = token.getParent()?.getChildren().length ?? 0;
      if (count > 0) token.zIndex(Math.min(index, count - 1));
      setLift(token, false, reducesMotion);
    }
  }

  return { drop };
}

function setLift(token: Group, isLifted: boolean, reducesMotion: boolean) {
  const body = token.findOne(`.${TOKEN_BODY_NAME}`);
  const shadow = token.findOne(`.${TOKEN_SHADOW_NAME}`);
  if (!body || !shadow) throw new Error("Token has no body or shadow");
  const scale = isLifted ? LIFTED : 1;
  const opacity = isLifted ? 1 : 0;
  if (isLifted) shadow.visible(true);
  if (reducesMotion) {
    body.scale({ x: scale, y: scale });
    shadow.opacity(opacity);
    shadow.visible(isLifted);
    return;
  }
  const easing = Konva.Easings.EaseOut;
  body.to({ scaleX: scale, scaleY: scale, duration: LIFT_SECONDS, easing });
  shadow.to({
    opacity,
    duration: LIFT_SECONDS,
    easing,
    // A token picked up again before it settled keeps its shadow.
    onFinish: () => shadow.visible(shadow.opacity() > 0),
  });
}
