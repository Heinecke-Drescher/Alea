import {
  ActionIcon,
  Button,
  ColorSwatch,
  Group,
  Input,
  Stack,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { useState } from "react";
import {
  MARK_COLORS,
  MARK_ICONS,
  MAX_MARK_LENGTH,
  type Mark,
} from "../room/marks";
import { badgeIcon } from "./badgeIcons";

interface MarkFormProps {
  current: Mark;
  onSave: (mark: Mark) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

function capitalized(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function MarkForm({
  current,
  onSave,
  onCancel,
  onDelete,
}: MarkFormProps) {
  const theme = useMantineTheme();
  const [text, setText] = useState(current.text);
  const [icon, setIcon] = useState(current.icon);
  const [color, setColor] = useState(current.color);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ text: text.trim(), icon, color });
      }}
    >
      <Stack>
        <TextInput
          label="Mark"
          description="Optional, e.g. Bloodied or Target"
          maxLength={MAX_MARK_LENGTH}
          value={text}
          onChange={(event) => setText(event.target.value)}
          data-autofocus
        />
        <Input.Wrapper label="Icon">
          <Group gap={4} mt={4}>
            {MARK_ICONS.map((name) => {
              const MarkIcon = badgeIcon(name);
              const isChosen = name === icon;
              return (
                <ActionIcon
                  key={name}
                  size="lg"
                  variant={isChosen ? "filled" : "default"}
                  color={`${color}.8`}
                  aria-label={capitalized(name)}
                  aria-pressed={isChosen}
                  onClick={() => setIcon(name)}
                >
                  <MarkIcon
                    size={20}
                    color={isChosen ? undefined : theme.colors[color][8]}
                  />
                </ActionIcon>
              );
            })}
          </Group>
        </Input.Wrapper>
        <Input.Wrapper label="Color">
          <Group gap={6} mt={4}>
            {MARK_COLORS.map((name) => (
              <ColorSwatch
                key={name}
                component="button"
                type="button"
                color={theme.colors[name][8]}
                aria-label={capitalized(name)}
                aria-pressed={name === color}
                onClick={() => setColor(name)}
                style={{ color: theme.white, cursor: "pointer" }}
              >
                {name === color && <IconCheck size={16} />}
              </ColorSwatch>
            ))}
          </Group>
        </Input.Wrapper>
        <Group>
          {onDelete && (
            <Button variant="subtle" color="red" onClick={onDelete}>
              Delete
            </Button>
          )}
          <Button variant="default" onClick={onCancel} ml="auto">
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </Group>
      </Stack>
    </form>
  );
}
