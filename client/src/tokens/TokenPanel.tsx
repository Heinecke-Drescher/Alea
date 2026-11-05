import {
  ActionIcon,
  Box,
  Group,
  Menu,
  Stack,
  Title,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";
import { useFogGuard } from "../fog/useFogGuard";
import { useImageFileDialog } from "../images/useImageFileDialog";
import { useRoom } from "../room/RoomContext";
import { addTokenFromFile, TOKEN_FILE_MEGABYTES } from "./addTokenFromFile";
import { PlaceholderModal } from "./PlaceholderModal";
import { TokenList } from "./TokenList";

export function TokenPanel() {
  const room = useRoom();
  const fogGuard = useFogGuard();
  const [isPlaceholderOpen, placeholderModal] = useDisclosure(false);
  const chooseTokens = useImageFileDialog({
    maxMegabytes: TOKEN_FILE_MEGABYTES,
    multiple: true,
    onFile: (file) =>
      addTokenFromFile(room, file, { blocked: fogGuard.blockedSquares() }),
  });

  return (
    // Fills a panel of limited height and scrolls the list below the title.
    <Stack gap="xs" mih={0} flex={1}>
      <Group justify="space-between" wrap="nowrap">
        <Title order={4}>Tokens</Title>
        <Menu position="bottom-end" shadow="md">
          <Menu.Target>
            <Tooltip label="Add tokens">
              <ActionIcon variant="subtle" aria-label="Add tokens">
                <IconPlus size={18} />
              </ActionIcon>
            </Tooltip>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item onClick={chooseTokens}>Upload images…</Menu.Item>
            <Menu.Item onClick={placeholderModal.open}>
              Add placeholders…
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
      <Box mih={0} style={{ overflowY: "auto", scrollbarWidth: "thin" }}>
        <TokenList />
      </Box>
      <PlaceholderModal
        opened={isPlaceholderOpen}
        onClose={placeholderModal.close}
      />
    </Stack>
  );
}
