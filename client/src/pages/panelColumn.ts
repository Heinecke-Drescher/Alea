import { TAB_WIDTH } from "../tokens/TokenDrawer";

// The column of panels over the right edge of the map on wide screens.
export const PANEL_COLUMN_WIDTH = 240;
export const PANEL_COLUMN_EDGE_GAP = 12;
export const PANEL_GAP = 12;

// The open token drawer's tab sticks out left of the column, so it counts too.
export function fitsBesideToolbar(
  viewWidth: number,
  toolbarWidth: number,
  axisShift: number,
) {
  const toolbarRight = viewWidth / 2 - axisShift + toolbarWidth / 2;
  const columnLeft =
    viewWidth - PANEL_COLUMN_EDGE_GAP - PANEL_COLUMN_WIDTH - TAB_WIDTH;
  return toolbarRight + PANEL_GAP <= columnLeft;
}
