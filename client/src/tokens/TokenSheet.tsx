import { Transition } from "@mantine/core";
import type { ReactNode, Ref } from "react";
import { FloatingPanel } from "../FloatingPanel";
import { TOKENS_TOGGLE_SPACE } from "./TokensToggle";

// Keeps names readable on narrow phones, where half the map would leave too little.
const MIN_SHEET_WIDTH = 200;
export const SHEET_WIDTH = `max(50%, ${MIN_SHEET_WIDTH}px)`;

interface TokenSheetProps {
  isOpen: boolean;
  ref: Ref<HTMLDivElement>;
  children: ReactNode;
}

// Rises from the lower edge of the map up to half its height, above the toggle and the zoom
// buttons. Hidden instead of removed, so the list keeps its state like the side panel did.
export function TokenSheet({ isOpen, ref, children }: TokenSheetProps) {
  return (
    <Transition
      mounted={isOpen}
      transition="slide-up"
      duration={200}
      keepMounted
      keepMountedMode="display-none"
    >
      {(styles) => (
        <FloatingPanel
          ref={ref}
          pos="absolute"
          right={12}
          // Leaves the left of the map free, so a token can be dragged sideways onto it.
          w={SHEET_WIDTH}
          maw="calc(100% - 24px)"
          bottom={TOKENS_TOGGLE_SPACE}
          mah="50%"
          p="sm"
          // The transition hides it with `display: none`, which has to win.
          style={{ display: "flex", ...styles }}
        >
          {children}
        </FloatingPanel>
      )}
    </Transition>
  );
}
