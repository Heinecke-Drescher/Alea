import type { KonvaEventObject } from "konva/lib/Node";
import type { Vector2d } from "konva/lib/types";
import type { ShapeKind } from "../../room/shapes";

export type Tool =
  | "select"
  | "paint"
  | "pen"
  | "eraser"
  | "text"
  | "measure"
  | "resize"
  | "alignImage"
  | ShapeKind
  | "reveal"
  | "hide";

const FOG_TOOLS: Tool[] = ["reveal", "hide"];

export function isFogTool(tool: Tool) {
  return FOG_TOOLS.includes(tool);
}

export interface ToolPointer {
  point: Vector2d;
  event: KonvaEventObject<MouseEvent>;
}

interface ToolPress extends ToolPointer {
  event: KonvaEventObject<PointerEvent>;
}

export interface BoardTool {
  selectsItems: boolean;
  listensToDrawings: boolean;
  onDown: (press: ToolPress) => void;
  onMove: (pointer: ToolPointer) => void;
  onUp: () => void;
  onCancel: () => void;
  // Whether the tool takes over a finger held still, instead of the menu opening at once.
  onLongPress?: (press: KonvaEventObject<PointerEvent>) => boolean;
}
