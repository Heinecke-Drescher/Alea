import {
  ActionIcon,
  Button,
  createTheme,
  Menu,
  Modal,
  Popover,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { useMediaQuery, useOrientation } from "@mantine/hooks";
import classes from "./theme.module.css";

export const TOOLTIP_DELAY = 500;
// Menus and popovers round their corners like the panels floating over the map, and the
// context menu on the map does the same.
export const MENU_RADIUS = "md";
// Everything that only reacts to the mouse, gray buttons, menu items, tabs, shares one gray;
// blue stays for choosing a tool, as blue means selection.
export const NEUTRAL_HOVER = "var(--mantine-color-default-hover)";

function isNeutral(props: { variant?: string; color?: string }) {
  return props.variant === "subtle" && props.color === "gray";
}

export const theme = createTheme({
  components: {
    ActionIcon: ActionIcon.extend({
      vars: (_, props) => ({
        root: isNeutral(props) ? { "--ai-hover": NEUTRAL_HOVER } : {},
      }),
    }),
    Button: Button.extend({
      vars: (_, props) => ({
        root: isNeutral(props) ? { "--button-hover": NEUTRAL_HOVER } : {},
      }),
    }),
    Menu: Menu.extend({ defaultProps: { radius: MENU_RADIUS } }),
    Popover: Popover.extend({ defaultProps: { radius: MENU_RADIUS } }),
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
