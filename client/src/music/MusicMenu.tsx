import { ActionIcon, Popover } from "@mantine/core";
import { IconMusic } from "@tabler/icons-react";
import { MusicPanel } from "./MusicPanel";

// Wide enough for YouTube to show its volume control.
const MENU_WIDTH = 800;

export function MusicMenu() {
  return (
    // Kept mounted while closed, because removing the player would stop the music.
    <Popover
      width={MENU_WIDTH}
      position="bottom-end"
      shadow="md"
      keepMounted
      keepMountedMode="display-none"
    >
      <Popover.Target>
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label="Music"
          title="Music"
        >
          <IconMusic size={20} />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        <MusicPanel />
      </Popover.Dropdown>
    </Popover>
  );
}
