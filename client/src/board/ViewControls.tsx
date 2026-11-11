import { ActionIcon, Divider, Group, Tooltip } from "@mantine/core";
import { IconZoomIn, IconZoomOut, IconZoomScan } from "@tabler/icons-react";
import { FloatingPanel } from "../FloatingPanel";
import { UndoButtons } from "./UndoButtons";

interface ViewControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitMap: () => void;
}

export function ViewControls({
  onZoomIn,
  onZoomOut,
  onFitMap,
}: ViewControlsProps) {
  // The same place on every layout, as narrow ones keep the lower right corner for the tokens.
  return (
    <FloatingPanel pos="absolute" bottom={12} left={12} p={4}>
      <Group gap={4} wrap="nowrap">
        <UndoButtons />
        <Divider orientation="vertical" />
        <Tooltip label="Zoom out (Ctrl+wheel)" position="top">
          <ActionIcon
            variant="subtle"
            size="lg"
            aria-label="Zoom out"
            onClick={onZoomOut}
          >
            <IconZoomOut size={20} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Zoom in (Ctrl+wheel)" position="top">
          <ActionIcon
            variant="subtle"
            size="lg"
            aria-label="Zoom in"
            onClick={onZoomIn}
          >
            <IconZoomIn size={20} />
          </ActionIcon>
        </Tooltip>
        <Divider orientation="vertical" />
        <Tooltip label="Fit map (Shift+1)" position="top">
          <ActionIcon
            variant="subtle"
            size="lg"
            aria-label="Fit map"
            onClick={onFitMap}
          >
            <IconZoomScan size={20} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </FloatingPanel>
  );
}
