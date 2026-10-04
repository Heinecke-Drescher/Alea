import { Group, Text } from "@mantine/core";
import type { ReactNode } from "react";

interface RollRowProps {
  label: ReactNode;
  value: number;
}

export function RollRow({ label, value }: RollRowProps) {
  return (
    <Group justify="space-between" wrap="nowrap">
      <Text c="dimmed" fz={20} truncate>
        {label}
      </Text>
      <Text fz={28} fw={700}>
        {value}
      </Text>
    </Group>
  );
}
