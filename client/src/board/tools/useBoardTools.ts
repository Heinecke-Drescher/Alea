import type { Room } from "../../room/createRoom";
import type { TextFontSize } from "../../room/texts";
import type { SelectionControls } from "../selection/useSelection";
import { useEraserTool } from "./eraser";
import { useFogTool } from "./fog";
import { useMeasureTool } from "./measure";
import { usePaintTool } from "./paint";
import { usePenTool } from "./pen";
import { resizeTool } from "./resize";
import { selectTool } from "./select";
import { useShapeTool } from "./shape";
import { useTextTool } from "./text";
import type { BoardTool, Tool } from "./tool";

export function useBoardTools(
  tool: Tool,
  selection: SelectionControls,
  room: Room,
  color: string,
  textSize: TextFontSize,
  onShapePlaced: (id: string) => void,
) {
  const { tool: pen, draftPoints } = usePenTool(room, color);
  const { tool: text, ...texts } = useTextTool(room, color, textSize);
  const { tool: measure, measurement } = useMeasureTool(room);
  const cone = useShapeTool(room, "cone", color, onShapePlaced);
  const square = useShapeTool(room, "square", color, onShapePlaced);
  const circle = useShapeTool(room, "circle", color, onShapePlaced);
  const reveal = useFogTool(room, "reveal");
  const hide = useFogTool(room, "hide");
  const tools: Record<Tool, BoardTool> = {
    select: selectTool(selection),
    paint: usePaintTool(room, color),
    pen,
    eraser: useEraserTool(room),
    text,
    measure,
    cone: cone.tool,
    square: square.tool,
    circle: circle.tool,
    resize: resizeTool,
    reveal: reveal.tool,
    hide: hide.tool,
  };
  return {
    activeTool: tools[tool],
    draftPoints,
    measurement,
    shapeDraft: cone.draft ?? square.draft ?? circle.draft,
    fogFrame: reveal.frame ?? hide.frame,
    texts,
  };
}
