import { Button, getDefaultZIndex } from "@mantine/core";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { FloatingPanel } from "../FloatingPanel";

interface TokensToggleProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function TokensToggle({ isOpen, onToggle }: TokensToggleProps) {
  return (
    <FloatingPanel
      pos="absolute"
      bottom={12}
      right={12}
      p={4}
      // Stays above the opened token panel, so it also closes it.
      style={{ zIndex: getDefaultZIndex("app") + 1 }}
    >
      <Button
        variant="subtle"
        color="gray"
        // As high as the zoom buttons beside it.
        h={34}
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
