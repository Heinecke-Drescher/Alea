import { Button, Group, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { FloatingPanel } from "../../FloatingPanel";
import { TOOLBAR_SPACE } from "../Toolbar";

interface HeldTokensHintProps {
  count: number;
  onCancel: () => void;
  axisShift: number;
}

// Without it, held tokens on a phone would be invisible, and nothing would tell how to let go.
export function HeldTokensHint({
  count,
  onCancel,
  axisShift,
}: HeldTokensHintProps) {
  const isFinger = useMediaQuery("(pointer: coarse)", undefined, {
    getInitialValueInEffect: false,
  });
  const what = count === 1 ? "the token" : `${count} tokens`;
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
        <Text size="sm">
          {isFinger ? "Tap" : "Click"} the map to place {what}
        </Text>
        <Button
          size="xs"
          variant="default"
          onClick={onCancel}
          style={{ flexShrink: 0 }}
        >
          Cancel
        </Button>
      </Group>
    </FloatingPanel>
  );
}
