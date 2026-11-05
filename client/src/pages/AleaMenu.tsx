import { Button, Menu, Text, Title } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import { Link } from "react-router";
import type { ConnectionState } from "../room/connection/connectRoom";

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
