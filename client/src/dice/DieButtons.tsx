import { ActionIcon, SimpleGrid, Tooltip } from "@mantine/core";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { usePlayer } from "../player/PlayerContext";
import { DIE_SIDES } from "../room/dice";
import { DieButton } from "./DieButton";
import { DraggableDie } from "./DraggableDie";
import { useDice } from "./useDice";

interface DieButtonsProps {
  columns: number;
}

export function DieButtons({ columns }: DieButtonsProps) {
  const { color } = usePlayer();
  const { isSecret, roll } = useDice();
  return (
    <SimpleGrid cols={columns} spacing="xs">
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

// Marks the dice while they roll secretly, so no roll is kept from the others by mistake.
export const SECRET_OUTLINE = "2px dashed var(--mantine-color-dimmed)";

const TOGGLE_ICON_SIZES = { sm: 16, lg: 20 };

// Large where a finger has to hit it.
export function SecretToggle({ size }: { size: "sm" | "lg" }) {
  const { isSecret, setSecret } = useDice();
  const label = isSecret ? "Roll for everyone" : "Roll secretly";
  const Icon = isSecret ? IconEyeOff : IconEye;
  return (
    <Tooltip label={label}>
      <ActionIcon
        size={size}
        variant={isSecret ? "light" : "subtle"}
        color="gray"
        aria-label={label}
        aria-pressed={isSecret}
        onClick={() => setSecret(!isSecret)}
      >
        <Icon size={TOGGLE_ICON_SIZES[size]} />
      </ActionIcon>
    </Tooltip>
  );
}
