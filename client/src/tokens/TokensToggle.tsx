import { Button, getDefaultZIndex } from "@mantine/core";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { FloatingPanel } from "../FloatingPanel";

const EDGE_GAP = 12;
// As high as the zoom buttons beside it.
const BUTTON_HEIGHT = 34;
const PADDING = 4;
const BORDER = 1;
// What the toggle takes from the lower edge of the map, with the same gap above it as below.
export const TOKENS_TOGGLE_SPACE =
  EDGE_GAP + BUTTON_HEIGHT + 2 * (PADDING + BORDER) + EDGE_GAP;

interface TokensToggleProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function TokensToggle({ isOpen, onToggle }: TokensToggleProps) {
  return (
    <FloatingPanel
      pos="absolute"
      bottom={EDGE_GAP}
      right={EDGE_GAP}
      p={PADDING}
      // Stays above the opened side panel, so it also closes it.
      style={{ zIndex: getDefaultZIndex("app") + 1 }}
    >
      <Button
        variant="subtle"
        color="gray"
        h={BUTTON_HEIGHT}
        px="xs"
        leftSection={
          isOpen ? <IconChevronDown size={18} /> : <IconChevronUp size={18} />
        }
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        Tokens
      </Button>
    </FloatingPanel>
  );
}
