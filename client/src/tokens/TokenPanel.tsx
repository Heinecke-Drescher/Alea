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
import { useImageFileDialog } from "../images/useImageFileDialog";
import { useRoom } from "../room/RoomContext";
import { TOKEN_FILE_MEGABYTES, tokenFromFile } from "./addTokenFromFile";
import { useHoldTokens } from "./holdTokens";
import { PlaceholderModal } from "./PlaceholderModal";
import { TokenList } from "./TokenList";

export function TokenPanel() {
  const room = useRoom();
  const holdTokens = useHoldTokens();
  const [isPlaceholderOpen, placeholderModal] = useDisclosure(false);
  const chooseTokens = useImageFileDialog({
    maxMegabytes: TOKEN_FILE_MEGABYTES,
    multiple: true,
    // Images that arrive while others are held join them.
    onFile: async (file) => holdTokens([await tokenFromFile(room, file)]),
  });

  return (
    // Fills a panel of limited size and scrolls the list below the title. The containment keeps a
    // long name from widening any panel around it, also the side panel's table-like scroll area,
    // so the name is cut off instead.
    <Stack gap="xs" mih={0} flex={1} style={{ contain: "inline-size" }}>
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
            <Menu.Item onClick={chooseTokens}>Upload images</Menu.Item>
            <Menu.Item onClick={placeholderModal.open}>
              Add placeholders
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
