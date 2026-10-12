import { modals } from "@mantine/modals";
import type { Room } from "../room/createRoom";
import { TokenNameForm } from "./TokenNameForm";

export function openRenameDialog(room: Room, tokenId: string) {
  const token = room.tokensMap.get(tokenId);
  if (!token) return;
  const modalId = modals.open({
    title: "Rename token",
    centered: true,
    children: (
      <TokenNameForm
        currentName={token.name}
        onSave={(name) => {
          room.renameToken(token.id, name);
          modals.close(modalId);
        }}
        onCancel={() => modals.close(modalId)}
      />
    ),
  });
}
