import { modals } from "@mantine/modals";
import type { Room } from "../room/createRoom";
import { validToken } from "../room/tokens";
import { TokenTextForm } from "./TokenTextForm";

export function openRenameDialog(room: Room, tokenId: string) {
  const token = validToken(tokenId, room.tokensMap.get(tokenId));
  if (!token) return;
  const modalId = modals.open({
    title: "Rename token",
    children: (
      <TokenTextForm
        label="Name"
        currentText={token.name}
        onSave={(name) => {
          room.renameToken(token.id, name);
          modals.close(modalId);
        }}
        onCancel={() => modals.close(modalId)}
      />
    ),
  });
}
