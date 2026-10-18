import type { KonvaEventObject } from "konva/lib/Node";
import type { Vector2d } from "konva/lib/types";

export type Tool =
  "select" | "paint" | "pen" | "eraser" | "measure" | "reveal" | "hide";

const DM_TOOLS: Tool[] = ["reveal", "hide"];

export function isDmTool(tool: Tool) {
  return DM_TOOLS.includes(tool);
}

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
