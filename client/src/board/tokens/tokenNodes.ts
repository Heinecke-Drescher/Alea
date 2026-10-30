import type { Node } from "konva/lib/Node";
import { isStatusEffect } from "../../room/effects";

export const TOKEN_NAME = "token";
export const TOKEN_BODY_NAME = "token-body";
export const EFFECT_BADGE_NAME = "effect-badge";

export function isOnToken(target: Node) {
  return target.findAncestors(`.${TOKEN_NAME}`, true).length > 0;
}

export function effectAt(target: Node) {
  const badge = target.findAncestor(`.${EFFECT_BADGE_NAME}`, true);
  const effect: unknown = badge?.getAttr("effect");
  return isStatusEffect(effect) ? effect : null;
}
