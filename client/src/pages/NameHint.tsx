import { Button, CloseButton, Text } from "@mantine/core";

interface NameHintProps {
  name: string;
  onChange: () => void;
  onClose: () => void;
}

// A new player starts with an assigned name instead of a form, which would look like signing up.
export function NameHint({ name, onChange, onClose }: NameHintProps) {
  return (
    <>
      <Text size="sm">
        You are <b>{name}</b>
      </Text>
      <Button
        size="xs"
        variant="default"
        onClick={onChange}
        style={{ flexShrink: 0 }}
      >
        Change name
      </Button>
      <CloseButton size="sm" aria-label="Keep this name" onClick={onClose} />
    </>
  );
}
