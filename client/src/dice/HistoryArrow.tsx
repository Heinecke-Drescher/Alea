import { Center } from "@mantine/core";
import type { ReactNode } from "react";

const SIZE = 28;

// The arrow that opens all rolls answers a mouse over its row like a subtle button, while the
// whole row stays the button; the newest roll beside it already has a gray background.
export function HistoryArrow({
  isRaised,
  children,
}: {
  isRaised: boolean;
  children: ReactNode;
}) {
  return (
    <Center
      w={SIZE}
      h={SIZE}
      bdrs="sm"
      bg={isRaised ? "var(--mantine-color-default-hover)" : undefined}
      style={{ flexShrink: 0 }}
    >
      {children}
    </Center>
  );
}
