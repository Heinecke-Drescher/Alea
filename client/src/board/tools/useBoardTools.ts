import type { Room } from "../../room/createRoom";
import type { Tool } from "../Toolbar";
import type { SelectionControls } from "../useSelection";
import { useEraserTool } from "./eraser";
import { useMeasureTool } from "./measure";
import { usePaintTool } from "./paint";
import { usePenTool } from "./pen";
import { selectTool } from "./select";
import type { BoardTool } from "./tool";

export function useBoardTools(
  tool: Tool,
  selection: SelectionControls,
  room: Room,
  color: string,
) {
  const { tool: pen, draftPoints } = usePenTool(room, color);
  const { tool: measure, measurement } = useMeasureTool(room);
  const tools: Record<Tool, BoardTool> = {
    select: selectTool(selection),
    paint: usePaintTool(room, color),
    pen,
    eraser: useEraserTool(room),
    measure,
  };
  return { activeTool: tools[tool], draftPoints, measurement };
}
