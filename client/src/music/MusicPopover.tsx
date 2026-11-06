import { Popover } from "@mantine/core";
import type { ReactElement } from "react";
import { MusicPanel } from "./MusicPanel";

// Wide enough for YouTube to show its volume control, yet within a phone's screen.
const MENU_WIDTH = "min(800px, calc(100vw - 32px))";

interface MusicPopoverProps {
  opened: boolean;
  onChange: (opened: boolean) => void;
  children: ReactElement;
}

export function MusicPopover({
  opened,
  onChange,
  children,
}: MusicPopoverProps) {
  return (
    // Kept mounted while closed, because removing the player would stop the music.
    // No roles: the target is the Alea menu's heading, which opens a menu of its own.
    <Popover
      opened={opened}
      onChange={onChange}
      width={MENU_WIDTH}
      position="bottom-start"
      shadow="md"
      keepMounted
      keepMountedMode="display-none"
      withRoles={false}
    >
      <Popover.Target>{children}</Popover.Target>
      <Popover.Dropdown>
        <MusicPanel />
      </Popover.Dropdown>
    </Popover>
  );
}
