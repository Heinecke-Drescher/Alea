import {
  Button,
  Menu,
  Text,
  Title,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { useFullscreenDocument } from "@mantine/hooks";
import {
  IconCheck,
  IconChevronDown,
  IconCrown,
  IconLink,
  IconLogout,
  IconMaximize,
  IconMinimize,
  IconMoon,
  IconMusic,
  IconShare,
} from "@tabler/icons-react";
import { useState } from "react";
import { Link } from "react-router";
import { MusicPopover } from "../music/MusicPopover";
import { usePlayer } from "../player/PlayerContext";
import type {
  Awareness,
  ConnectionState,
} from "../room/connection/connectRoom";
import { useWideLayout } from "../theme";
import { RoomPeople } from "./RoomPeople";
import { canShareRoomLink, copyRoomLink, shareRoomLink } from "./roomLink";
import { useDmControl } from "./useDmControl";

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
  const { name } = usePlayer();
  const isDisconnected = connection === "disconnected";
  const { setColorScheme } = useMantineColorScheme();
  const isDark = useComputedColorScheme("light") === "dark";
  const [isMusicOpen, setMusicOpen] = useState(false);
  const fullscreen = useFullscreenDocument();
  // On a phone the system's share sheet reaches the group's chat directly.
  const isSharing = !useWideLayout() && canShareRoomLink();

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
            <RoomPeople
              awareness={awareness}
              dmState={dmControl.state}
              onEditName={onEditName}
            />
            {/* Before the sync the DM is unknown; without a name nobody could tell who took the role. */}
            {isSynced && name !== "" && <DmItem dmControl={dmControl} />}
            {isSharing ? (
              <Menu.Item
                leftSection={<IconShare size={16} />}
                onClick={shareRoomLink}
              >
                Share room link
              </Menu.Item>
            ) : (
              <Menu.Item
                leftSection={<IconLink size={16} />}
                onClick={copyRoomLink}
              >
                Copy room link
              </Menu.Item>
            )}
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
            {document.fullscreenEnabled && (
              <Menu.Item
                leftSection={
                  fullscreen.fullscreen ? (
                    <IconMinimize size={16} />
                  ) : (
                    <IconMaximize size={16} />
                  )
                }
                onClick={fullscreen.toggle}
              >
                {fullscreen.fullscreen ? "Exit full screen" : "Full screen"}
              </Menu.Item>
            )}
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
      // The people list already shows who the DM is.
      return state.isAway ? (
        <Menu.Item leftSection={icon} onClick={() => confirmTakeOver(state.dm)}>
          Take over DM ({state.dm.name} is away)
        </Menu.Item>
      ) : null;
  }
}
