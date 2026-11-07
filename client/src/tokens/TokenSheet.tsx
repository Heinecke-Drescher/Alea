import { Transition } from "@mantine/core";
import type { ReactNode, Ref } from "react";
import { FloatingPanel } from "../FloatingPanel";
import { TOKENS_TOGGLE_SPACE } from "./TokensToggle";

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
          left={12}
          right={12}
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
