import { Button, Group, Stack, TextInput } from "@mantine/core";
import { useState } from "react";

interface TokenTextFormProps {
  label: string;
  description?: string;
  maxLength?: number;
  currentText: string;
  onSave: (text: string) => void;
  onCancel: () => void;
}

export function TokenTextForm({
  label,
  description,
  maxLength,
  currentText,
  onSave,
  onCancel,
}: TokenTextFormProps) {
  const [text, setText] = useState(currentText);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(text.trim());
      }}
    >
      <Stack>
        <TextInput
          label={label}
          description={description}
          maxLength={maxLength}
          value={text}
          onChange={(event) => setText(event.target.value)}
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
