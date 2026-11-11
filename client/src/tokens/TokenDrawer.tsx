import { Box, Stack, Text, Tooltip, UnstyledButton } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import type { ReactNode, Ref } from "react";
import { FloatingPanel } from "../FloatingPanel";
import { NEUTRAL_HOVER } from "../theme";
import { usePointerRaise } from "../usePointerRaise";

export const TAB_WIDTH = 30;
const TAB_HEIGHT = 160;
// The drawer's column keeps this distance to the edge of the map view.
const VIEW_GAP = 12;

// Like a box of tokens next to the table: pulled out by its tab when needed, remembered per browser.
interface TokenDrawerProps {
  onClose: () => void;
  ref: Ref<HTMLDivElement>;
  children: ReactNode;
}

export function TokenDrawer({ onClose, ref, children }: TokenDrawerProps) {
  const [isOpen, setOpen] = useLocalStorage({
    key: "alea-tokens-opened",
    defaultValue: true,
    getInitialValueInEffect: false,
  });
  const label = isOpen ? "Hide tokens" : "Show tokens";
  const tabRaise = usePointerRaise(false);
  const tab = (
    <FloatingPanel
      pos="absolute"
      top={VIEW_GAP}
      w={TAB_WIDTH}
      // The whole tab is the button, so its panel shows the hover in its rounded shape.
      bg={tabRaise.isRaised ? NEUTRAL_HOVER : undefined}
      style={{
        // Open, it overlaps the drawer's border by a pixel, so both look like one piece.
        ...(isOpen ? { left: 1 - TAB_WIDTH } : { right: -VIEW_GAP }),
        pointerEvents: "auto",
        borderRight: "none",
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
      }}
    >
      <Tooltip label={label} position="left">
        <UnstyledButton
          w="100%"
          h={TAB_HEIGHT}
          c="dimmed"
          aria-label={label}
          aria-expanded={isOpen}
          onClick={() => {
            if (isOpen) onClose();
            setOpen(!isOpen);
          }}
          onPointerEnter={tabRaise.handlers.onPointerEnter}
          onPointerLeave={tabRaise.handlers.onPointerLeave}
        >
          <Stack gap="xs" align="center" justify="center" h="100%">
            {isOpen ? (
              <IconChevronRight size={18} />
            ) : (
              <IconChevronLeft size={18} />
            )}
            <Text size="sm" fw={500} style={{ writingMode: "vertical-rl" }}>
              Tokens
            </Text>
          </Stack>
        </UnstyledButton>
      </Tooltip>
    </FloatingPanel>
  );

  if (!isOpen) return <Box pos="relative">{tab}</Box>;
  return (
    <FloatingPanel
      ref={ref}
      pos="relative"
      p="sm"
      // Shrinks in a low window, but keeps its title and its tab.
      mih={TAB_HEIGHT + 2 * VIEW_GAP}
      display="flex"
      style={{ pointerEvents: "auto" }}
    >
      {children}
      {tab}
    </FloatingPanel>
  );
}
