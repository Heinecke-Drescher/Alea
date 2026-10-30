import type { SelectionControls } from "../selection/useSelection";
import type { BoardTool } from "./tool";

export function selectTool(selection: SelectionControls): BoardTool {
  return {
    selectsItems: true,
    listensToDrawings: true,
    onDown({ point, event }) {
      if (event.target !== event.target.getStage()) return;
      if (event.evt.ctrlKey || event.evt.metaKey) return;
      selection.beginArea(point);
    },
    onMove: ({ point }) => selection.extendArea(point),
    onUp: selection.endArea,
  };
}
