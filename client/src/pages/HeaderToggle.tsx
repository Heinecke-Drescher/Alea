import { ActionIcon, Indicator, Tooltip } from "@mantine/core";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { FloatingPanel } from "../FloatingPanel";

export function HideHeaderButton({ onHide }: { onHide: () => void }) {
  return (
    <Tooltip label="Hide header">
      <ActionIcon
        variant="subtle"
        color="gray"
        size="lg"
        ml="auto"
        style={{ flexShrink: 0 }}
        aria-label="Hide header"
        onClick={onHide}
      >
        <IconChevronUp size={20} />
      </ActionIcon>
    </Tooltip>
  );
}

interface ShowHeaderButtonProps {
  isDisconnected: boolean;
  onShow: () => void;
}

// In the corner of the map, where the header's own button was. The warning about a lost connection
// hides with the header, so a red dot keeps it in sight.
export function ShowHeaderButton({
  isDisconnected,
  onShow,
}: ShowHeaderButtonProps) {
  const label = isDisconnected ? "Show header (not connected)" : "Show header";
  return (
    <FloatingPanel pos="absolute" top={12} right={12} p={4}>
      <Tooltip label={label}>
        <Indicator color="red" size={10} disabled={!isDisconnected}>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            aria-label={label}
            onClick={onShow}
          >
            <IconChevronDown size={20} />
          </ActionIcon>
        </Indicator>
      </Tooltip>
    </FloatingPanel>
  );
}
