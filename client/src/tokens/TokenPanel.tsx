import { ActionIcon, Group, Stack, Title, Tooltip } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useFogGuard } from "../fog/useFogGuard";
import { useImageFileDialog } from "../images/useImageFileDialog";
import { useRoom } from "../room/RoomContext";
import { addTokenFromFile, TOKEN_FILE_MEGABYTES } from "./addTokenFromFile";
import { TokenList } from "./TokenList";

export function TokenPanel() {
  const room = useRoom();
  const fogGuard = useFogGuard();
  const chooseTokens = useImageFileDialog({
    maxMegabytes: TOKEN_FILE_MEGABYTES,
    multiple: true,
    onFile: (file) =>
      addTokenFromFile(room, file, { blocked: fogGuard.blockedSquares() }),
  });

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Title order={4}>Tokens</Title>
        <Tooltip label="Add tokens…">
          <ActionIcon
            variant="subtle"
            aria-label="Add tokens…"
            onClick={chooseTokens}
          >
            <IconPlus size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>
      <TokenList />
    </Stack>
  );
}
