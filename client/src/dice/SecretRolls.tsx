import { Group, Stack, Text } from "@mantine/core";
import type { SecretRoll } from "./secretRoll";

export function SecretRolls({ rolls }: { rolls: SecretRoll[] }) {
  return (
    <Stack gap={4}>
      <Text size="sm" fw={600}>
        Secret rolls
      </Text>
      {rolls.length === 0 && (
        <Text size="sm" c="dimmed">
          Only you see these rolls.
        </Text>
      )}
      {rolls.map((roll) => (
        <Group key={roll.id} justify="space-between" wrap="nowrap">
          <Text size="sm" c="dimmed">
            {roll.at.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            · d{roll.sides}
          </Text>
          <Text fw={700}>{roll.value}</Text>
        </Group>
      ))}
    </Stack>
  );
}
