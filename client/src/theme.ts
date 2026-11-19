import {
  ActionIcon,
  Button,
  createTheme,
  type MantineTransition,
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
// Marks what only this player sees: dice rolled secretly and a scene being prepared, so nothing
// is kept from the others by mistake.
export const PRIVATE_OUTLINE = "2px dashed var(--mantine-color-dimmed)";

// So one sees where a menu comes from; theme.module.css picks the corner touching its button.
const GROW_FROM_ANCHOR: MantineTransition = {
  in: { opacity: 1, transform: "scale(1)" },
  out: { opacity: 0, transform: "scale(.95)" },
  transitionProperty: "transform, opacity",
};
const DROPDOWN_TRANSITION = {
  transition: GROW_FROM_ANCHOR,
  duration: 150,
  timingFunction: "ease-out",
};

function isNeutral(props: { variant?: string; color?: string }) {
  return props.variant === "subtle" && props.color === "gray";
}

export const theme = createTheme({
  respectReducedMotion: true,
  components: {
    ActionIcon: ActionIcon.extend({
      classNames: { root: classes.actionIcon },
      vars: (_, props) => ({
        root: isNeutral(props) ? { "--ai-hover": NEUTRAL_HOVER } : {},
      }),
    }),
    Button: Button.extend({
      vars: (_, props) => ({
        root: isNeutral(props) ? { "--button-hover": NEUTRAL_HOVER } : {},
      }),
    }),
    Menu: Menu.extend({
      defaultProps: {
        radius: MENU_RADIUS,
        transitionProps: DROPDOWN_TRANSITION,
      },
    }),
    Popover: Popover.extend({
      defaultProps: {
        radius: MENU_RADIUS,
        transitionProps: DROPDOWN_TRANSITION,
      },
    }),
    Modal: Modal.extend({
      defaultProps: { centered: true },
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

// Phones held sideways are about 360 to 430 pixels high, desktop windows hardly ever this low.
const LOW_WINDOW = "(max-height: 500px)";

// Narrow or low: a phone in either orientation.
export function usePhoneLayout() {
  const isWide = useWideLayout();
  const isLow = useMediaQuery(LOW_WINDOW, undefined, {
    getInitialValueInEffect: false,
  });
  return !isWide || isLow;
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
