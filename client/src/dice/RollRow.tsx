import { Group, Text } from "@mantine/core";
import type { ReactNode } from "react";

interface RollRowProps {
  label: ReactNode;
  value: number;
  compact?: boolean;
}

export function RollRow({ label, value, compact = false }: RollRowProps) {
  const lineHeight = compact ? 1.4 : undefined;
  return (
    <Group justify="space-between" wrap="nowrap" px="xs">
      <Text c="dimmed" fz={compact ? 16 : 20} lh={lineHeight} truncate>
        {label}
      </Text>
      <Text fz={compact ? 22 : 28} lh={lineHeight} fw={700}>
        {value}
      </Text>
    </Group>
  );
}
