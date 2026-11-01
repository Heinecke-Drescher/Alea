import type { BoardTool } from "./tool";

// The map resizer and the map image aligner handle their own mouse events.
export const ownEventsTool: BoardTool = {
  selectsItems: false,
  listensToDrawings: false,
  onDown() {},
  onMove() {},
  onUp() {},
};
