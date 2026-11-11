import { Box, Stack, Text } from "@mantine/core";
import { motion } from "motion/react";
import { rollColor } from "../room/rolls";
import type { Roll } from "../room/roomStore";
import { RollRow } from "./RollRow";
import { useDice } from "./useDice";

function RollPlayer({ roll }: { roll: Roll }) {
  return (
    <Text span c={rollColor(roll)} fw={600}>
      {roll.player}
    </Text>
  );
}

interface RollProps {
  roll: Roll;
  compact?: boolean;
}

function RollEntry({ roll, compact }: RollProps) {
  return (
    <RollRow
      label={
        <>
          <RollPlayer roll={roll} /> · d{roll.sides}
        </>
      }
      value={roll.value}
      compact={compact}
    />
  );
}

function LastRoll({ roll, compact }: RollProps) {
  return (
    <motion.div
      key={roll.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* A neutral background keeps every player color readable; the stripe shows who rolled. */}
      <Box
        bg="var(--mantine-color-default-hover)"
        bdrs="sm"
        style={{
          borderLeft: `4px solid var(--mantine-color-${rollColor(roll)}-6)`,
        }}
      >
        <RollEntry roll={roll} compact={compact} />
      </Box>
    </motion.div>
  );
}

// The own secret rolls and everyone's rolls share the line; the newest of both is shown.
export function NewestRoll({ compact = false }: { compact?: boolean }) {
  const { secretRolls, rolls } = useDice();
  const [newestSecret] = secretRolls;
  const [newest] = rolls;
  const isSecretNewer =
    newestSecret && (!newest || newestSecret.at.getTime() > newest.at);
  if (isSecretNewer) {
    return (
      <RollRow
        label={`Secret · d${newestSecret.sides}`}
        value={newestSecret.value}
        compact={compact}
      />
    );
  }
  return newest ? (
    <LastRoll roll={newest} compact={compact} />
  ) : (
    <Text c="dimmed">No rolls yet</Text>
  );
}

export function RollHistory() {
  const [lastRoll, ...olderRolls] = useDice().rolls;
  return (
    <Stack gap={4}>
      {lastRoll && <LastRoll roll={lastRoll} />}
      {olderRolls.map((olderRoll) => (
        <RollEntry key={olderRoll.id} roll={olderRoll} />
      ))}
    </Stack>
  );
}
