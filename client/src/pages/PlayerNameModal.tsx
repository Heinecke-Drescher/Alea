import { Button, Group, Modal, Stack, TextInput } from "@mantine/core";
import { useState } from "react";
import { PlayerColorPicker } from "../player/PlayerColorPicker";
import { defaultPlayerColor, type PlayerColor } from "../room/playerColors";

const MAX_NAME_LENGTH = 32;

interface PlayerNameModalProps {
  opened: boolean;
  currentName: string;
  // null while the player has not picked a color, so it follows the typed name.
  currentColor: PlayerColor | null;
  onSave: (name: string, color: PlayerColor) => void;
  onCancel: (() => void) | null;
}

export function PlayerNameModal({
  opened,
  currentName,
  currentColor,
  onSave,
  onCancel,
}: PlayerNameModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onCancel ?? (() => {})}
      title="Who are you?"
      withCloseButton={onCancel !== null}
      closeOnClickOutside={onCancel !== null}
      closeOnEscape={onCancel !== null}
      centered
    >
      <PlayerForm
        currentName={currentName}
        currentColor={currentColor}
        onSave={onSave}
      />
    </Modal>
  );
}

function PlayerForm({
  currentName,
  currentColor,
  onSave,
}: Pick<PlayerNameModalProps, "currentName" | "currentColor" | "onSave">) {
  const [name, setName] = useState(currentName);
  const [pickedColor, setPickedColor] = useState(currentColor);
  const trimmedName = name.trim();
  const color = pickedColor ?? defaultPlayerColor(trimmedName);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(trimmedName, color);
      }}
    >
      <Stack>
        <TextInput
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={MAX_NAME_LENGTH}
          placeholder="Shown next to your dice rolls"
          data-autofocus
        />
        <PlayerColorPicker value={color} onChange={setPickedColor} />
        <Group justify="flex-end">
          <Button type="submit" color={color} disabled={!trimmedName}>
            Save
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
