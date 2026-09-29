import { Button, Group, SimpleGrid, Stack, Text } from "@mantine/core";
import { motion } from "motion/react";
import { nanoid } from "nanoid";
import { useState } from "react";
import { DIE_SIDES, rollDie, type DieSides } from "../../../shared/dice";

const MAX_ROLLS = 20;

interface Roll {
  id: string;
  sides: DieSides;
  value: number;
}

export function DicePanel() {
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [lastRoll, ...olderRolls] = rolls;

  function roll(sides: DieSides) {
    const newRoll = { id: nanoid(), sides, value: rollDie(sides) };
    setRolls((previous) => [newRoll, ...previous].slice(0, MAX_ROLLS));
  }

  return (
    <Stack>
      <SimpleGrid cols={4}>
        {DIE_SIDES.map((sides) => (
          <Button key={sides} variant="default" onClick={() => roll(sides)}>
            d{sides}
          </Button>
        ))}
      </SimpleGrid>
      {lastRoll ? (
        <motion.div
          key={lastRoll.id}
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            rotate: [0, -20, 20, -10, 0],
            scale: [0.6, 1.15, 1],
          }}
          transition={{ duration: 0.5 }}
        >
          <Stack gap={0} align="center">
            <Text c="dimmed">d{lastRoll.sides}</Text>
            <Text fz={48} fw={700}>
              {lastRoll.value}
            </Text>
          </Stack>
        </motion.div>
      ) : (
        <Text c="dimmed" ta="center">
          Click a die to roll
        </Text>
      )}
      <Stack gap={4}>
        {olderRolls.map((olderRoll) => (
          <Group key={olderRoll.id} justify="space-between">
            <Text c="dimmed">d{olderRoll.sides}</Text>
            <Text>{olderRoll.value}</Text>
          </Group>
        ))}
      </Stack>
    </Stack>
  );
}
