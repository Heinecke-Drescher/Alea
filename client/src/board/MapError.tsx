import { Alert, Button, Stack, Text } from "@mantine/core";
import type { FallbackProps } from "react-error-boundary";

export function MapError({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <Alert color="red" title="The map could not be displayed" m="md">
      <Stack align="flex-start">
        <Text size="sm">
          {error instanceof Error ? error.message : String(error)}
        </Text>
        <Text size="sm">
          Remove the broken token or background in the side panel, then try
          again.
        </Text>
        <Button color="red" variant="light" onClick={resetErrorBoundary}>
          Try again
        </Button>
      </Stack>
    </Alert>
  );
}
