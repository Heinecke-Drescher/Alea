import type { MantineTheme } from "@mantine/core";
import { modals } from "@mantine/modals";
import type { Room } from "../room/createRoom";
import type { PlayerColor } from "../room/playerColors";
import { placeholderOf } from "./placeholders";
import { createPlaceholderImage } from "./placeholderImage";
import { PlaceholderForm } from "./PlaceholderModal";

export function openPlaceholderImageDialog(
  room: Room,
  tokenId: string,
  color: PlayerColor,
  theme: MantineTheme,
) {
  const modalId = modals.open({
    title: "Placeholder image",
    centered: true,
    children: (
      <PlaceholderForm
        initialColor={color}
        forOneToken
        errorTitle="Could not change the image"
        onSubmit={async ({ color, icon }) => {
          // Someone may have removed it while the dialog was open.
          const token = room.tokensMap.get(tokenId);
          if (!token) return;
          const { label, number } = placeholderOf(token.name);
          const image = await createPlaceholderImage(
            icon ? { icon, number } : { label },
            color,
            theme,
          );
          room.assertSpaceForImage(image, token.imageId);
          room.setTokenImage(tokenId, image);
        }}
        onDone={() => modals.close(modalId)}
      />
    ),
  });
}
