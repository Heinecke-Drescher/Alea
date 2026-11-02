import type { KonvaEventObject } from "konva/lib/Node";
import { CLICK_DISTANCE, TAP_SCREEN_DISTANCE } from "../selection/selection";
import type { SelectionControls } from "../selection/useSelection";
import type { BoardTool } from "./tool";

function clickDistance(event: KonvaEventObject<PointerEvent>) {
  if (event.evt.pointerType !== "touch") return CLICK_DISTANCE;
  return TAP_SCREEN_DISTANCE / event.target.getAbsoluteScale().x;
}

export function selectTool(selection: SelectionControls): BoardTool {
  return {
    selectsItems: true,
    listensToDrawings: true,
    onDown({ point, event }) {
      if (event.target !== event.target.getStage()) return;
      if (event.evt.ctrlKey || event.evt.metaKey) return;
      selection.beginArea(point, clickDistance(event));
    },
    onMove: ({ point }) => selection.extendArea(point),
    onUp: selection.endArea,
  };
}
