import type { BoardTool } from "./tool";

// The map resizer and the map image aligner handle their own pointer events.
export const ownEventsTool: BoardTool = {
  selectsItems: false,
  listensToDrawings: false,
  onDown() {},
  onMove() {},
  onUp() {},
  onCancel() {},
};
