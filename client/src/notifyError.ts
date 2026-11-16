import { notifications } from "@mantine/notifications";

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

// Errors in event handlers never reach an error boundary, so they are shown here and logged.
export function notifyError(title: string, error: unknown) {
  console.error(error);
  notifications.show({ color: "red", title, message: errorMessage(error) });
}
