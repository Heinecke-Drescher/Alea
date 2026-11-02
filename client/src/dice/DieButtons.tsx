import { SimpleGrid, Switch, type MantineSpacing } from "@mantine/core";
import { usePlayer } from "../player/PlayerContext";
import { DIE_SIDES } from "../room/dice";
import { DieButton } from "./DieButton";
import { FingerDraggableDie } from "./FingerDraggableDie";
import { useDice } from "./useDice";

interface DieButtonsProps {
  columns: number;
  spacing: MantineSpacing;
  // The side panel keeps the browser's drag for the mouse; the dice bar on a phone follows the finger.
  dragWith: "mouse" | "finger";
}

export function DieButtons({ columns, spacing, dragWith }: DieButtonsProps) {
  const { color } = usePlayer();
  const { isSecret, roll } = useDice();
  return (
    <SimpleGrid cols={columns} spacing={spacing}>
      {DIE_SIDES.map((sides) =>
        dragWith === "finger" && !isSecret ? (
          <FingerDraggableDie
            key={sides}
            sides={sides}
            color={color}
            onRoll={() => roll(sides)}
          />
        ) : (
          <DieButton
            key={sides}
            sides={sides}
            color={color}
            isDraggable={dragWith === "mouse" && !isSecret}
            onRoll={() => roll(sides)}
          />
        ),
      )}
    </SimpleGrid>
  );
}

export function SecretSwitch() {
  const { isDm } = usePlayer();
  const { wantsSecret, setWantsSecret } = useDice();
  if (!isDm) return null;
  return (
    <Switch
      label="Secret rolls"
      checked={wantsSecret}
      onChange={(event) => setWantsSecret(event.currentTarget.checked)}
    />
  );
}
