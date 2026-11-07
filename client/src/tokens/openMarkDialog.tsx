import { modals } from "@mantine/modals";
import type { Room } from "../room/createRoom";
import { MAX_MARK_LENGTH, tokenMarks } from "../room/marks";
import { TokenTextForm } from "./TokenTextForm";

// Without an index the dialog adds a new mark.
export function openMarkDialog(room: Room, tokenId: string, index?: number) {
  const token = room.tokensMap.get(tokenId);
  if (!token) return;
  const current = index === undefined ? undefined : tokenMarks(token)[index];
  if (index !== undefined && !current) return;
  const modalId = modals.open({
    title: current ? "Edit mark" : "Add mark",
    centered: true,
    children: (
      <TokenTextForm
        label="Mark"
        description="Optional, e.g. Bloodied or Target"
        maxLength={MAX_MARK_LENGTH}
        currentText={current?.text ?? ""}
        onSave={(text) => {
          if (index === undefined) room.addMark(tokenId, { text });
          else room.changeMark(tokenId, index, { text });
          modals.close(modalId);
        }}
        onCancel={() => modals.close(modalId)}
        {...(index !== undefined && {
          onDelete: () => {
            room.removeMark(tokenId, index);
            modals.close(modalId);
          },
        })}
      />
    ),
  });
}
