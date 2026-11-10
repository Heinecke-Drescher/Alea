import { Box, Portal } from "@mantine/core";
import type { ReactNode, Ref } from "react";
import { ghostPixels, GHOST_SIZE, type ScreenSample } from "./useScreenDrag";

interface DragGhostProps {
  // Where the drag started; the ghost is then moved through the ref.
  start: ScreenSample | null;
  ref: Ref<HTMLDivElement>;
  children: ReactNode;
}

export function DragGhost({ start, ref, children }: DragGhostProps) {
  if (!start) return null;
  return (
    <Portal>
      <Box
        ref={ref}
        pos="fixed"
        opacity={0.7}
        style={{
          ...ghostPixels(start),
          width: GHOST_SIZE,
          pointerEvents: "none",
          zIndex: 1000,
        }}
      >
        {children}
      </Box>
    </Portal>
  );
}
