import { modals } from "@mantine/modals";
import type { Room } from "../room/createRoom";
import { MAX_MARK_LENGTH, tokenMark } from "../room/mark";
import { TokenTextForm } from "./TokenTextForm";

export function openMarkDialog(room: Room, tokenId: string) {
  const token = room.tokensMap.get(tokenId);
  if (!token) return;
  const modalId = modals.open({
    title: "Mark token",
    centered: true,
    children: (
      <TokenTextForm
        label="Mark"
        description="Optional, e.g. Bloodied or Target"
        maxLength={MAX_MARK_LENGTH}
        currentText={tokenMark(token) ?? ""}
        onSave={(mark) => {
          room.setMark(token.id, mark);
          modals.close(modalId);
        }}
        onCancel={() => modals.close(modalId)}
      />
    ),
  });
}
