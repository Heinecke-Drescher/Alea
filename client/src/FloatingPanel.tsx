import { Paper, type PaperProps } from "@mantine/core";
import type { ComponentProps } from "react";

// One look for everything that floats over the map; menus and dialogs above it have a stronger
// shadow, so a stronger shadow always means lying higher.
export function FloatingPanel(props: PaperProps & ComponentProps<"div">) {
  return <Paper withBorder shadow="sm" radius="md" {...props} />;
}
