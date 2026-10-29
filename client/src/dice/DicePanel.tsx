import { Box, SimpleGrid, Stack, Switch, Text } from "@mantine/core";
import { motion } from "motion/react";
import { useState } from "react";
import { DIE_SIDES, rollDie, type DieSides } from "../room/dice";
import { usePlayer } from "../player/PlayerContext";
import { rollColor } from "../room/rolls";
import type { Roll } from "../room/roomStore";
import { useRoom } from "../room/RoomContext";
import { useY } from "../room/useY";
import { DieButton } from "./DieButton";
import { RollRow } from "./RollRow";
import { rollSecretly, type SecretRoll } from "./secretRoll";
import { SecretRolls } from "./SecretRolls";
import { useShowCritical } from "./useCriticalRolls";

const MAX_SECRET_ROLLS = 20;

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

export function DicePanel() {
  const room = useRoom();
  const player = usePlayer();
  const rolls = [...useY(room.rollsArray)].reverse();
  const [lastRoll, ...olderRolls] = rolls;
  const [wantsSecret, setWantsSecret] = useState(false);
  const [secretRolls, setSecretRolls] = useState<SecretRoll[]>([]);
  const isSecret = player.isDm && wantsSecret;
  const showCritical = useShowCritical();

  function roll(sides: DieSides) {
    // Secret rolls stay in this browser and never reach the room document.
    if (isSecret) {
      const secretRoll = rollSecretly(sides);
      setSecretRolls((previous) =>
        [secretRoll, ...previous].slice(0, MAX_SECRET_ROLLS),
      );
      showCritical({ ...secretRoll, color: player.color, delay: 0 });
      return;
    }
    room.addRoll(player.name, player.color, sides, rollDie(sides));
  }

  return (
    <Stack>
      {player.isDm && (
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
            color={player.color}
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
      <Stack gap={4}>
        {lastRoll && (
          <motion.div
            key={lastRoll.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* A neutral background keeps every player color readable; the stripe shows who rolled. */}
            <Box
              bg="var(--mantine-color-default-hover)"
              bdrs="sm"
              style={{
                borderLeft: `4px solid var(--mantine-color-${rollColor(lastRoll)}-6)`,
              }}
            >
              <RollEntry roll={lastRoll} />
            </Box>
          </motion.div>
        )}
        {olderRolls.map((olderRoll) => (
          <RollEntry key={olderRoll.id} roll={olderRoll} />
        ))}
      </Stack>
    </Stack>
  );
}
