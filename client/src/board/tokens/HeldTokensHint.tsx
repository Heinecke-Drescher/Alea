import { Button, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { ToolbarHint } from "../ToolbarHint";

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
    <ToolbarHint axisShift={axisShift}>
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
    </ToolbarHint>
  );
}
