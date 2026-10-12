import { Button, Group, Stack, TextInput } from "@mantine/core";
import { useState } from "react";

interface TokenNameFormProps {
  currentName: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}

export function TokenNameForm({
  currentName,
  onSave,
  onCancel,
}: TokenNameFormProps) {
  const [name, setName] = useState(currentName);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(name.trim());
      }}
    >
      <Stack>
        <TextInput
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          data-autofocus
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </Group>
      </Stack>
    </form>
  );
}
