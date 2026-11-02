import { Stack, Text } from "@mantine/core";
import { DieButtons, SecretSwitch } from "./DieButtons";
import { RollHistory } from "./RollHistory";
import { SecretRolls } from "./SecretRolls";
import { useDice } from "./useDice";

export function DicePanel() {
  const { isSecret, secretRolls } = useDice();

  return (
    <Stack>
      <SecretSwitch />
      <DieButtons columns={4} spacing="md" />
      <Text c="dimmed" ta="center" size="sm">
        {isSecret
          ? "Click to roll secretly"
          : "Drag a die onto the map to roll it there, or click to roll"}
      </Text>
      {isSecret && <SecretRolls rolls={secretRolls} />}
      <RollHistory />
    </Stack>
  );
}
