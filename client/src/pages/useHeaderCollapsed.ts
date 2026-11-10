import { useLocalStorage, useMediaQuery } from "@mantine/hooks";
import { useWideLayout } from "../theme";

// Phones held sideways are about 360 to 430 pixels high, desktop windows hardly ever this low.
const LOW_WINDOW = "(max-height: 500px)";

// Only narrow or low windows need the header's height for the map; elsewhere it always shows.
// Remembered per browser, like the token drawer.
export function useHeaderCollapsed() {
  const isWide = useWideLayout();
  const isLow = useMediaQuery(LOW_WINDOW, undefined, {
    getInitialValueInEffect: false,
  });
  const [isStoredCollapsed, setCollapsed] = useLocalStorage({
    key: "alea-header-collapsed",
    defaultValue: false,
    getInitialValueInEffect: false,
  });
  const canCollapse = !isWide || isLow;
  return {
    canCollapse,
    isCollapsed: canCollapse && isStoredCollapsed,
    setCollapsed,
  };
}
