import { Button, Group, Modal, TextInput } from "@mantine/core";
import { useState } from "react";

const MAX_NAME_LENGTH = 32;

interface PlayerNameModalProps {
  opened: boolean;
  currentName: string;
  onSave: (name: string) => void;
  onCancel: (() => void) | null;
}

export function PlayerNameModal({
  opened,
  currentName,
  onSave,
  onCancel,
}: PlayerNameModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onCancel ?? (() => {})}
      title="What's your name?"
      withCloseButton={onCancel !== null}
      closeOnClickOutside={onCancel !== null}
      closeOnEscape={onCancel !== null}
      centered
    >
      <NameForm currentName={currentName} onSave={onSave} />
    </Modal>
  );
}

function NameForm({
  currentName,
  onSave,
}: Pick<PlayerNameModalProps, "currentName" | "onSave">) {
  const [name, setName] = useState(currentName);
  const trimmedName = name.trim();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(trimmedName);
      }}
    >
      <TextInput
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={MAX_NAME_LENGTH}
        placeholder="Shown next to your dice rolls"
        data-autofocus
      />
      <Group justify="flex-end" mt="md">
        <Button type="submit" disabled={!trimmedName}>
          Save
        </Button>
      </Group>
    </form>
  );
}
