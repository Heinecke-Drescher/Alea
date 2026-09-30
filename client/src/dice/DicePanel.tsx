import { Button, Group, SimpleGrid, Stack, Text } from "@mantine/core";
import { motion } from "motion/react";
import { DIE_SIDES, rollDie } from "../../../shared/dice";
import { useRoom } from "../room/RoomContext";
import { useY } from "../room/useY";

interface DicePanelProps {
  playerName: string;
}

export function DicePanel({ playerName }: DicePanelProps) {
  const room = useRoom();
  const rolls = [...useY(room.rollsArray)].reverse();
  const [lastRoll, ...olderRolls] = rolls;

  return (
    <Stack>
      <SimpleGrid cols={4}>
        {DIE_SIDES.map((sides) => (
          <Button
            key={sides}
            variant="default"
            size="compact-md"
            onClick={() => room.addRoll(playerName, sides, rollDie(sides))}
          >
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
            <Text c="dimmed">
              {lastRoll.player} · d{lastRoll.sides}
            </Text>
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
          <Group key={olderRoll.id} justify="space-between" wrap="nowrap">
            <Text c="dimmed" truncate>
              {olderRoll.player} · d{olderRoll.sides}
            </Text>
            <Text>{olderRoll.value}</Text>
          </Group>
        ))}
      </Stack>
    </Stack>
  );
}
