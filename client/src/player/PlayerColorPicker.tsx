import { CheckIcon, ColorSwatch, Group, useMantineTheme } from "@mantine/core";
import { PLAYER_COLORS, type PlayerColor } from "../room/playerColors";

interface PlayerColorPickerProps {
  value: PlayerColor;
  onChange: (color: PlayerColor) => void;
}

export function PlayerColorPicker({ value, onChange }: PlayerColorPickerProps) {
  const theme = useMantineTheme();
  return (
    <Group gap={6}>
      {PLAYER_COLORS.map((option) => (
        <ColorSwatch
          key={option}
          component="button"
          type="button"
          color={theme.colors[option][6]}
          size={26}
          aria-label={`Use ${option}`}
          onClick={() => onChange(option)}
        >
          {option === value && <CheckIcon size={12} color="white" />}
        </ColorSwatch>
      ))}
    </Group>
  );
}
