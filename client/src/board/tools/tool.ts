import type { KonvaEventObject } from "konva/lib/Node";
import type { Vector2d } from "konva/lib/types";

export interface ToolPointer {
  point: Vector2d;
  event: KonvaEventObject<MouseEvent>;
}

export interface BoardTool {
  selectsItems: boolean;
  listensToStrokes: boolean;
  onDown: (pointer: ToolPointer) => void;
  onMove: (pointer: ToolPointer) => void;
  onUp: () => void;
  onCancel?: () => void;
}
