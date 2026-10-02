import {
  Button,
  CloseButton,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import { useListState } from "@mantine/hooks";
import { motion } from "motion/react";
import { nanoid } from "nanoid";
import { DIE_SIDES, rollDie, type DieSides } from "../../../shared/dice";
import { mapCenter } from "../room/grid";
import { useRoom } from "../room/RoomContext";
import { useY } from "../room/useY";
import { startDieDrag } from "./dieDrag";
import { DieIcon } from "./DieIcon";

interface HandDie {
  id: string;
  sides: DieSides;
}

interface DicePanelProps {
  playerName: string;
}

export function DicePanel({ playerName }: DicePanelProps) {
  const room = useRoom();
  const rolls = [...useY(room.rollsArray)].reverse();
  const [lastRoll, ...olderRolls] = rolls;
  const [hand, handlers] = useListState<HandDie>([]);

  function roll(sides: DieSides) {
    room.addRoll(
      playerName,
      sides,
      rollDie(sides),
      mapCenter(room.mapBounds()),
    );
  }

  return (
    <Stack>
      <SimpleGrid cols={4}>
        {DIE_SIDES.map((sides) => (
          <Button
            key={sides}
            variant="default"
            size="compact-md"
            onClick={() => handlers.append({ id: nanoid(), sides })}
          >
            d{sides}
          </Button>
        ))}
      </SimpleGrid>
      {hand.length > 0 ? (
        <Group gap="xs">
          {hand.map((die) => (
            <Paper
              key={die.id}
              withBorder
              px="xs"
              py={4}
              draggable
              onDragStart={(event) =>
                startDieDrag(event.dataTransfer, die.sides)
              }
              style={{ cursor: "grab" }}
            >
              <Group gap={4} wrap="nowrap">
                <Group
                  gap={4}
                  wrap="nowrap"
                  onDoubleClick={() => roll(die.sides)}
                >
                  <DieIcon sides={die.sides} />
                  <Text fw={700}>d{die.sides}</Text>
                </Group>
                <CloseButton
                  size="xs"
                  aria-label={`Remove d${die.sides}`}
                  onClick={() =>
                    handlers.filter((other) => other.id !== die.id)
                  }
                />
              </Group>
            </Paper>
          ))}
        </Group>
      ) : (
        <Text c="dimmed" ta="center" size="sm">
          Add dice to your hand, then drag one onto the map to roll it
        </Text>
      )}
      {lastRoll && (
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
