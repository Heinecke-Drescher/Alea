import { createTheme, Tooltip, useMantineTheme } from "@mantine/core";
import { useMediaQuery, useOrientation } from "@mantine/hooks";

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

// The same breakpoint at which the app shell shows the side panel next to the map. Read at once,
// so nothing renders in the wrong place first.
export function useWideLayout() {
  const { breakpoints } = useMantineTheme();
  return useMediaQuery(`(min-width: ${breakpoints.sm})`, undefined, {
    getInitialValueInEffect: false,
  });
}

// A phone held upright, whose fitted map usually leaves room below it. The screen's orientation,
// not the page's, as the on-screen keyboard makes the page wider than high.
export function useNarrowPortrait() {
  const isWide = useWideLayout();
  const { type } = useOrientation({ getInitialValueInEffect: false });
  return !isWide && type.startsWith("portrait");
}
