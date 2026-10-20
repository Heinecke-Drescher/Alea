import { Button, Menu, Text, Title } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import { useMapFiles } from "../mapFile/useMapFiles";

interface AleaMenuProps {
  isSynced: boolean;
}

export function AleaMenu({ isSynced }: AleaMenuProps) {
  const mapFiles = useMapFiles();

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
        {/* Before the sync, an export would hold an empty map and an import would mix with the loaded one. */}
        <Menu.Dropdown>
          {mapFiles.canImport && (
            <Menu.Item disabled={!isSynced} onClick={mapFiles.importMap}>
              Import map…
            </Menu.Item>
          )}
          <Menu.Item disabled={!isSynced} onClick={mapFiles.exportMap}>
            Export map
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Title>
  );
}
