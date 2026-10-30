import { ActionIcon, Popover, Stack, Text, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconTypography } from "@tabler/icons-react";
import {
  TEXT_FONT_SIZES,
  type TextFontSize,
  type TextSizeName,
} from "../../room/texts";

const SIZE_NAMES = Object.keys(TEXT_FONT_SIZES) as TextSizeName[];

function nameOf(size: TextFontSize) {
  const name = SIZE_NAMES.find((other) => TEXT_FONT_SIZES[other] === size);
  if (!name) throw new Error(`Unknown text size ${size}`);
  return name;
}

interface TextToolButtonProps {
  isActive: boolean;
  onSelect: () => void;
  size: TextFontSize;
  onSizeChange: (size: TextFontSize) => void;
}

// The sizes open below the tool, as the colors do below the color swatch.
export function TextToolButton({
  isActive,
  onSelect,
  size,
  onSizeChange,
}: TextToolButtonProps) {
  const [isPicking, picking] = useDisclosure();
  const label = `Write text (${nameOf(size)})`;

  return (
    <Popover
      opened={isPicking}
      onDismiss={picking.close}
      position="bottom"
      shadow="md"
    >
      <Popover.Target>
        <Tooltip label={label} position="bottom" disabled={isPicking}>
          <ActionIcon
            variant={isActive ? "filled" : "subtle"}
            size="lg"
            aria-label={label}
            onClick={() => {
              if (isActive) {
                picking.toggle();
                return;
              }
              onSelect();
              picking.open();
            }}
          >
            <IconTypography size={20} />
          </ActionIcon>
        </Tooltip>
      </Popover.Target>
      <Popover.Dropdown p={6}>
        <Stack gap={6}>
          {SIZE_NAMES.map((name) => (
            <ActionIcon
              key={name}
              variant={TEXT_FONT_SIZES[name] === size ? "filled" : "subtle"}
              size="lg"
              aria-label={`Text size ${name}`}
              onClick={() => {
                onSizeChange(TEXT_FONT_SIZES[name]);
                picking.close();
              }}
            >
              <Text fw={700}>{name}</Text>
            </ActionIcon>
          ))}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
