import { Group, SimpleGrid, Stack, Switch, Text } from "@mantine/core";
import { motion } from "motion/react";
import { useState } from "react";
import { DIE_SIDES, rollDie, type DieSides } from "../../../shared/dice";
import type { PlayerColor } from "../room/playerColors";
import { rollColor } from "../room/rolls";
import type { Roll } from "../room/roomStore";
import { useRoom } from "../room/RoomContext";
import { useDm } from "../room/useDm";
import { useY } from "../room/useY";
import { DieButton } from "./DieButton";
import { rollSecretly, type SecretRoll } from "./secretRoll";
import { SecretRolls } from "./SecretRolls";

const MAX_SECRET_ROLLS = 20;

function RollPlayer({ roll }: { roll: Roll }) {
  return (
    <Text span c={rollColor(roll)} fw={600}>
      {roll.player}
    </Text>
  );
}

interface DicePanelProps {
  playerId: string;
  playerName: string;
  playerColor: PlayerColor;
}

export function DicePanel({
  playerId,
  playerName,
  playerColor,
}: DicePanelProps) {
  const room = useRoom();
  const rolls = [...useY(room.rollsArray)].reverse();
  const [lastRoll, ...olderRolls] = rolls;
  const isDm = useDm()?.playerId === playerId;
  const [wantsSecret, setWantsSecret] = useState(false);
  const [secretRolls, setSecretRolls] = useState<SecretRoll[]>([]);
  const isSecret = isDm && wantsSecret;

  function roll(sides: DieSides) {
    // Secret rolls stay in this browser and never reach the room document.
    if (isSecret) {
      const secretRoll = rollSecretly(sides);
      setSecretRolls((previous) =>
        [secretRoll, ...previous].slice(0, MAX_SECRET_ROLLS),
      );
      return;
    }
    room.addRoll(playerName, playerColor, sides, rollDie(sides));
  }

  return (
    <Stack>
      {isDm && (
        <Switch
          label="Secret rolls"
          checked={wantsSecret}
          onChange={(event) => setWantsSecret(event.currentTarget.checked)}
        />
      )}
      <SimpleGrid cols={4}>
        {DIE_SIDES.map((sides) => (
          <DieButton
            key={sides}
            sides={sides}
            color={playerColor}
            isDraggable={!isSecret}
            onRoll={() => roll(sides)}
          />
        ))}
      </SimpleGrid>
      <Text c="dimmed" ta="center" size="sm">
        {isSecret
          ? "Click to roll secretly"
          : "Drag a die onto the map to roll it there, or click to roll"}
      </Text>
      {isSecret && <SecretRolls rolls={secretRolls} />}
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
              <RollPlayer roll={lastRoll} /> · d{lastRoll.sides}
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
              <RollPlayer roll={olderRoll} /> · d{olderRoll.sides}
            </Text>
            <Text>{olderRoll.value}</Text>
          </Group>
        ))}
      </Stack>
    </Stack>
  );
}
