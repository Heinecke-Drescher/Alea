import { notifications } from "@mantine/notifications";
import { RoomSpaceError } from "../room/roomSpace";

export function showRoomSpaceError(error: unknown) {
  if (!(error instanceof RoomSpaceError)) throw error;
  notifications.show({ color: "red", message: error.message });
}
