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

function RollEntry({ roll }: { roll: Roll }) {
  return (
    <RollRow
      label={
        <>
          <RollPlayer roll={roll} /> · d{roll.sides}
        </>
      }
      value={roll.value}
    />
  );
}

export function LastRoll({ roll }: { roll: Roll }) {
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
        <RollEntry roll={roll} />
      </Box>
    </motion.div>
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
