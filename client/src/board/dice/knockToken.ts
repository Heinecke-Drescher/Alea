import type { Group as GroupNode } from "konva/lib/Group";
import type { Node } from "konva/lib/Node";
import type { Stage } from "konva/lib/Stage";
import { Easings, Tween } from "konva/lib/Tween";
import type { TokenHit } from "../../dice/tokenHits";
import { CELL_SIZE } from "../../room/grid";
import { TOKEN_BODY_NAME } from "../tokens/tokenNodes";

const KNOCK_DISTANCE = CELL_SIZE;
const KNOCK_TURN = 35;
const KNOCK_SECONDS = 0.25;
const SETTLE_SECONDS = 0.8;

function pushAndReturn(
  node: Node,
  away: Record<string, number>,
  home: Record<string, number>,
) {
  let isBack = false;
  let back: Tween | undefined;
  const push = new Tween({
    node,
    duration: KNOCK_SECONDS,
    easing: Easings.EaseOut,
    ...away,
    onFinish: () => {
      back = new Tween({
        node,
        duration: SETTLE_SECONDS,
        easing: Easings.ElasticEaseOut,
        ...home,
        onFinish: () => {
          isBack = true;
        },
      });
      back.play();
    },
  });
  push.play();
  return () => {
    push.destroy();
    back?.destroy();
    if (!isBack) node.setAttrs(home);
  };
}

export function knockToken(stage: Stage, { tokenId, direction }: TokenHit) {
  const token = stage.findOne<GroupNode>(`#${tokenId}`);
  // The token may have been removed since the throw.
  if (!token) return () => {};
  const body = token.findOne(`.${TOKEN_BODY_NAME}`);
  if (!body) throw new Error(`Token ${tokenId} has no body`);
  // Only the body moves, around its fixed place in the middle of the token,
  // so the token's own position stays with React and dragging.
  const middle = body.offsetX();
  return pushAndReturn(
    body,
    {
      x: middle + direction.x * KNOCK_DISTANCE,
      y: middle + direction.y * KNOCK_DISTANCE,
      rotation: direction.x < 0 ? -KNOCK_TURN : KNOCK_TURN,
    },
    { x: middle, y: middle, rotation: 0 },
  );
}
