import { Group } from "@mantine/core";
import type { ReactNode } from "react";
import { FloatingPanel } from "../FloatingPanel";
import { TOOLBAR_SPACE } from "./Toolbar";

interface ToolbarHintProps {
  axisShift: number;
  children: ReactNode;
}

export function ToolbarHint({ axisShift, children }: ToolbarHintProps) {
  return (
    <FloatingPanel
      pos="absolute"
      top={TOOLBAR_SPACE}
      left={`calc(50% - ${axisShift}px)`}
      // Otherwise it may only use the width right of `left`, half the map, and squeezes its text.
      w="max-content"
      maw="calc(100% - 24px)"
      p="xs"
      style={{ transform: "translateX(-50%)" }}
    >
      <Group gap="sm" wrap="nowrap">
        {children}
      </Group>
    </FloatingPanel>
  );
}
