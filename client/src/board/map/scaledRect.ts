import type { Node } from "konva/lib/Node";
import type { IRect } from "konva/lib/types";

// A transformer scales the node it changes instead of resizing it.
export function scaledRect(node: Node): IRect {
  return {
    x: node.x(),
    y: node.y(),
    width: node.width() * node.scaleX(),
    height: node.height() * node.scaleY(),
  };
}
