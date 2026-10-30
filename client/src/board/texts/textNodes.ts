import type { Node } from "konva/lib/Node";

export const TEXT_NAME = "map-text";

export function textIdAt(target: Node) {
  return target.hasName(TEXT_NAME) ? target.id() : null;
}
