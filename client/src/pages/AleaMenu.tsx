import { Button, Menu, Text, Title } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import { Link } from "react-router";
import { useBackgroundFile } from "../background/useBackgroundFile";
import { useClearDrawings } from "../drawings/useClearDrawings";
import { useMapFiles } from "../mapFile/useMapFiles";
import { useMapImageFile } from "../mapImage/useMapImageFile";
import type { ConnectionState } from "../room/connectRoom";

interface AleaMenuProps {
  isSynced: boolean;
  connection: ConnectionState;
}

export function AleaMenu({ isSynced, connection }: AleaMenuProps) {
  const mapFiles = useMapFiles();
  const isDisconnected = connection === "disconnected";
  const background = useBackgroundFile();
  const mapImage = useMapImageFile();
  const drawings = useClearDrawings();

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
          {/* Before the sync, an export would hold an empty map and an import would mix with the loaded one. */}
          {mapFiles.canImport && (
            <Menu.Item disabled={!isSynced} onClick={mapFiles.importMap}>
              Import map…
            </Menu.Item>
          )}
          <Menu.Item disabled={!isSynced} onClick={mapFiles.exportMap}>
            Export map
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item disabled={!isSynced} onClick={background.chooseBackground}>
            Set background…
          </Menu.Item>
          {background.hasBackground && (
            <Menu.Item color="red" onClick={background.removeBackground}>
              Remove background
            </Menu.Item>
          )}
          {mapImage.canSet && (
            <Menu.Item disabled={!isSynced} onClick={mapImage.chooseMapImage}>
              Set map image…
            </Menu.Item>
          )}
          {mapImage.canSet && mapImage.hasMapImage && (
            <Menu.Item color="red" onClick={mapImage.removeMapImage}>
              Remove map image
            </Menu.Item>
          )}
          {drawings.canClear && (
            <Menu.Item
              color="red"
              disabled={!isSynced}
              onClick={drawings.clearDrawings}
            >
              Clear drawings…
            </Menu.Item>
          )}
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
