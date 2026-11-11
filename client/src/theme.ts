import { createTheme, Modal, Tooltip, useMantineTheme } from "@mantine/core";
import { useMediaQuery, useOrientation } from "@mantine/hooks";
import classes from "./theme.module.css";

export const TOOLTIP_DELAY = 500;

export const theme = createTheme({
  components: {
    Modal: Modal.extend({
      classNames: { root: classes.modalRoot, inner: classes.modalInner },
    }),
    Tooltip: Tooltip.extend({
      defaultProps: { openDelay: TOOLTIP_DELAY, withArrow: true },
    }),
    TooltipGroup: Tooltip.Group.extend({
      defaultProps: { openDelay: TOOLTIP_DELAY, closeDelay: 100 },
    }),
  },
});

// Below it, the layout is a phone's. Read at once, so nothing renders in the wrong place first.
export function useWideLayout() {
  const { breakpoints } = useMantineTheme();
  return useMediaQuery(`(min-width: ${breakpoints.sm})`, undefined, {
    getInitialValueInEffect: false,
  });
}

// Only both together: a narrow window on a monitor lies on a landscape screen, and a phone held
// upright with its on-screen keyboard open shows a landscape page.
export function useLandscape() {
  const { type } = useOrientation({ getInitialValueInEffect: false });
  const isPageLandscape = useMediaQuery("(orientation: landscape)", undefined, {
    getInitialValueInEffect: false,
  });
  return type.startsWith("landscape") && isPageLandscape;
}
