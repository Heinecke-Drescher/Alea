import type { Node } from "konva/lib/Node";

export const TOKEN_NAME = "token";
export const TOKEN_BODY_NAME = "token-body";
export const BADGE_NAME = "token-badge";

export function isOnToken(target: Node) {
  return target.findAncestors(`.${TOKEN_NAME}`, true).length > 0;
}

export function badgeLabelAt(target: Node) {
  const badge = target.findAncestor(`.${BADGE_NAME}`, true);
  const label: unknown = badge?.getAttr("label");
  return typeof label === "string" ? label : null;
}
