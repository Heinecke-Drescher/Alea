import type { BoardTool } from "./tool";

// The map resizer handles its own mouse events.
export const resizeTool: BoardTool = {
  selectsItems: false,
  listensToStrokes: false,
  onDown() {},
  onMove() {},
  onUp() {},
};
