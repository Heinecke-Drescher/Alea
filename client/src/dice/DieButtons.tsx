import { SimpleGrid, Switch, type MantineSpacing } from "@mantine/core";
import { usePlayer } from "../player/PlayerContext";
import { DIE_SIDES } from "../room/dice";
import { DieButton } from "./DieButton";
import { DraggableDie } from "./DraggableDie";
import { useDice } from "./useDice";

interface DieButtonsProps {
  columns: number;
  spacing: MantineSpacing;
}

export function DieButtons({ columns, spacing }: DieButtonsProps) {
  const { color } = usePlayer();
  const { isSecret, roll } = useDice();
  return (
    <SimpleGrid cols={columns} spacing={spacing}>
      {DIE_SIDES.map((sides) =>
        isSecret ? (
          <DieButton
            key={sides}
            sides={sides}
            color={color}
            onRoll={() => roll(sides)}
          />
        ) : (
          <DraggableDie
            key={sides}
            sides={sides}
            color={color}
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
