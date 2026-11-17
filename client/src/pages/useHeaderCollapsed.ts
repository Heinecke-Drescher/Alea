import { useLocalStorage } from "@mantine/hooks";
import { usePhoneLayout } from "../theme";

// Only narrow or low windows need the header's height for the map; elsewhere it always shows.
// Remembered per browser, like the token drawer.
export function useHeaderCollapsed() {
  const canCollapse = usePhoneLayout();
  const [isStoredCollapsed, setCollapsed] = useLocalStorage({
    key: "alea-header-collapsed",
    defaultValue: false,
    getInitialValueInEffect: false,
  });
  return {
    canCollapse,
    isCollapsed: canCollapse && isStoredCollapsed,
    setCollapsed,
  };
}
