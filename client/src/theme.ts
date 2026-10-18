import { createTheme, Tooltip } from "@mantine/core";

export const TOOLTIP_DELAY = 500;

export const theme = createTheme({
  components: {
    Tooltip: Tooltip.extend({
      defaultProps: { openDelay: TOOLTIP_DELAY, withArrow: true },
    }),
    TooltipGroup: Tooltip.Group.extend({
      defaultProps: { openDelay: TOOLTIP_DELAY, closeDelay: 100 },
    }),
  },
});
