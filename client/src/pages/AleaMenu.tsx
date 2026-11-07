import {
  Button,
  Center,
  ColorSwatch,
  Menu,
  Text,
  Title,
  useComputedColorScheme,
  useMantineColorScheme,
  useMantineTheme,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconChevronDown,
  IconCrown,
  IconLink,
  IconLogout,
  IconMoon,
  IconMusic,
} from "@tabler/icons-react";
import { useState } from "react";
import { Link } from "react-router";
import { MusicPopover } from "../music/MusicPopover";
import { usePlayer } from "../player/PlayerContext";
import type {
  Awareness,
  ConnectionState,
} from "../room/connection/connectRoom";
import { useDmControl } from "./useDmControl";

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

interface AleaMenuProps {
  connection: ConnectionState;
  awareness: Awareness | null;
  isSynced: boolean;
  onEditName: () => void;
}

export function AleaMenu({
  connection,
  awareness,
  isSynced,
  onEditName,
}: AleaMenuProps) {
  const dmControl = useDmControl(awareness);
  const theme = useMantineTheme();
  const { name, color } = usePlayer();
  const isDisconnected = connection === "disconnected";
  const { setColorScheme } = useMantineColorScheme();
  const isDark = useComputedColorScheme("light") === "dark";
  const [isMusicOpen, setMusicOpen] = useState(false);

  return (
    <MusicPopover opened={isMusicOpen} onChange={setMusicOpen}>
      {/* A heading may hold a button, but not the other way round. */}
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
            <Menu.Item
              leftSection={<IconLink size={16} />}
              onClick={copyRoomLink}
            >
              Copy room link
            </Menu.Item>
            <Menu.Item
              leftSection={
                // As wide as the icons, so all texts start in one line.
                <Center w={16}>
                  <ColorSwatch color={theme.colors[color][6]} size={14} />
                </Center>
              }
              onClick={onEditName}
            >
              Edit name ({name})
            </Menu.Item>
            {/* Before the sync the DM is unknown; without a name nobody could tell who took the role. */}
            {isSynced && name !== "" && <DmItem dmControl={dmControl} />}
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconMusic size={16} />}
              onClick={() => setMusicOpen(true)}
            >
              Music
            </Menu.Item>
            <Menu.Item
              leftSection={<IconMoon size={16} />}
              rightSection={isDark && <IconCheck size={16} />}
              onClick={() => setColorScheme(isDark ? "light" : "dark")}
            >
              Dark mode
            </Menu.Item>
            <Menu.Divider />
            {/* Without a connection, leaving would drop the changes that are not saved yet.
              A link ignores `disabled`, so the click itself is stopped too. */}
            <Menu.Item
              component={Link}
              to="/"
              leftSection={<IconLogout size={16} />}
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
    </MusicPopover>
  );
}

function DmItem({ dmControl }: { dmControl: ReturnType<typeof useDmControl> }) {
  const { state, becomeDm, releaseDm, confirmTakeOver } = dmControl;
  const icon = <IconCrown size={16} />;
  switch (state.kind) {
    case "none":
      return (
        <Menu.Item leftSection={icon} onClick={becomeDm}>
          Become DM
        </Menu.Item>
      );
    case "self":
      return (
        <Menu.Item leftSection={icon} onClick={releaseDm}>
          Release DM
        </Menu.Item>
      );
    case "other":
      return state.isAway ? (
        <Menu.Item leftSection={icon} onClick={() => confirmTakeOver(state.dm)}>
          Take over DM ({state.dm.name} is away)
        </Menu.Item>
      ) : (
        <Menu.Item leftSection={icon} disabled>
          DM: {state.dm.name}
        </Menu.Item>
      );
  }
}
