import type { Node } from "konva/lib/Node";

export const TOKEN_NAME = "token";
export const TOKEN_BODY_NAME = "token-body";

export function isOnToken(target: Node) {
  return target.findAncestors(`.${TOKEN_NAME}`, true).length > 0;
}

export function tokenIdAt(target: Node) {
  return target.findAncestor(`.${TOKEN_NAME}`, true)?.id() ?? null;
}
