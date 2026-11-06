import { Button, Menu, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconChevronDown } from "@tabler/icons-react";
import { Link } from "react-router";
import type { ConnectionState } from "../room/connection/connectRoom";

function showCopyError(link: string) {
  notifications.show({
    color: "red",
    title: "Could not copy the link",
    message: link,
    // Long enough to copy the link by hand.
    autoClose: false,
  });
}

// Browsers offer the clipboard only over HTTPS or on localhost, not in a home network over http.
function copyRoomLink() {
  const link = window.location.origin + window.location.pathname;
  if (!("clipboard" in navigator)) {
    showCopyError(link);
    return;
  }
  navigator.clipboard.writeText(link).then(
    () => notifications.show({ message: "Room link copied" }),
    () => showCopyError(link),
  );
}

export function AleaMenu({ connection }: { connection: ConnectionState }) {
  const isDisconnected = connection === "disconnected";

  return (
    // A heading may hold a button, but not the other way round.
    <Title order={3}>
      <Menu position="bottom-start" shadow="md">
        <Menu.Target>
          <Button
            variant="subtle"
            color="gray"
            px="xs"
            rightSection={<IconChevronDown size={16} />}
          >
            <Text span fz="h3" fw={700}>
              Alea
            </Text>
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item onClick={copyRoomLink}>Copy room link</Menu.Item>
          <Menu.Divider />
          {/* Without a connection, leaving would drop the changes that are not saved yet.
              A link ignores `disabled`, so the click itself is stopped too. */}
          <Menu.Item
            component={Link}
            to="/"
            disabled={isDisconnected}
            onClick={(event) => {
              if (isDisconnected) event.preventDefault();
            }}
          >
            Leave room
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Title>
  );
}
