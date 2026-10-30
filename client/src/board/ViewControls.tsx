import { ActionIcon, Divider, Group, Paper, Tooltip } from "@mantine/core";
import { IconZoomScan } from "@tabler/icons-react";
import { UndoButtons } from "./UndoButtons";

export function ViewControls({ onFitMap }: { onFitMap: () => void }) {
  return (
    <Paper pos="absolute" bottom={12} right={12} p={4} shadow="sm" withBorder>
      <Group gap={4} wrap="nowrap">
        <UndoButtons />
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
    </Paper>
  );
}
