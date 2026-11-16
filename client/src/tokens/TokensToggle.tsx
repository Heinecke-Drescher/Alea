import { Button } from "@mantine/core";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import {
  FLOATING_BAR_SPACE,
  FLOATING_BUTTON_HEIGHT,
  FLOATING_GAP,
  FLOATING_PADDING,
  FloatingPanel,
} from "../FloatingPanel";

export const TOKENS_TOGGLE_SPACE = FLOATING_BAR_SPACE;

interface TokensToggleProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function TokensToggle({ isOpen, onToggle }: TokensToggleProps) {
  return (
    <FloatingPanel
      pos="absolute"
      bottom={FLOATING_GAP}
      right={FLOATING_GAP}
      p={FLOATING_PADDING}
    >
      <Button
        variant="subtle"
        color="gray"
        h={FLOATING_BUTTON_HEIGHT}
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
