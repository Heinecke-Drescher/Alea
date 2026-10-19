import type { Room } from "../../room/createRoom";
import type { SelectionControls } from "../selection/useSelection";
import { useEraserTool } from "./eraser";
import { useFogTool } from "./fog";
import { useMeasureTool } from "./measure";
import { usePaintTool } from "./paint";
import { usePenTool } from "./pen";
import { selectTool } from "./select";
import { useShapeTool } from "./shape";
import type { BoardTool, Tool } from "./tool";

export function useBoardTools(
  tool: Tool,
  selection: SelectionControls,
  room: Room,
  color: string,
) {
  const { tool: pen, draftPoints } = usePenTool(room, color);
  const { tool: measure, measurement } = useMeasureTool(room);
  const cone = useShapeTool(room, "cone", color);
  const square = useShapeTool(room, "square", color);
  const circle = useShapeTool(room, "circle", color);
  const reveal = useFogTool(room, "reveal");
  const hide = useFogTool(room, "hide");
  const tools: Record<Tool, BoardTool> = {
    select: selectTool(selection),
    paint: usePaintTool(room, color),
    pen,
    eraser: useEraserTool(room),
    measure,
    cone: cone.tool,
    square: square.tool,
    circle: circle.tool,
    reveal: reveal.tool,
    hide: hide.tool,
  };
  return {
    activeTool: tools[tool],
    draftPoints,
    measurement,
    shapeDraft: cone.draft ?? square.draft ?? circle.draft,
    fogFrame: reveal.frame ?? hide.frame,
  };
}
