import {
  Avatar,
  Group,
  Stack,
  Text,
  ThemeIcon,
  type PaperProps,
} from "@mantine/core";
import { useClickOutside, useHotkeys } from "@mantine/hooks";
import { FloatingPanel } from "../FloatingPanel";
import { isOutOfFight, tokenEffects } from "../room/effects";
import { tokenMarks } from "../room/marks";
import type { Token } from "../room/roomStore";
import { embeddedImage } from "../room/tokens";
import { useRoom } from "../room/RoomContext";
import { useY } from "../room/useY";
import { badgeIcon, tokenBadges } from "./badgeIcons";
import { useShownToken } from "./useShownToken";

const IMAGE_SIZE = 96;
export const DETAIL_WIDTH = 200;

// One token with every status and the full text of every mark, which the badges have no room for.
export function TokenDetailContent({ token }: { token: Token }) {
  const room = useRoom();
  const images = useY(room.imagesMap);
  const badges = tokenBadges(tokenEffects(token), tokenMarks(token));

  return (
    <Stack gap="xs" align="center">
      <Avatar
        src={embeddedImage(images[token.imageId])}
        style={{
          width: "100%",
          maxWidth: IMAGE_SIZE,
          height: "auto",
          aspectRatio: "1",
          filter: isOutOfFight(token) ? "grayscale(1)" : undefined,
        }}
      />
      <Text
        size="sm"
        fw={500}
        ta="center"
        c={token.name === "" ? "dimmed" : undefined}
        style={{ overflowWrap: "anywhere" }}
      >
        {token.name === "" ? "Unnamed" : token.name}
      </Text>
      {badges.map((badge) => {
        const BadgeIcon = badgeIcon(badge.icon);
        return (
          <Group
            key={badge.key}
            gap="xs"
            wrap="nowrap"
            align="flex-start"
            w="100%"
          >
            <ThemeIcon
              size={18}
              radius="xl"
              color={`${badge.color}.8`}
              style={{ flexShrink: 0 }}
            >
              <BadgeIcon size={12} />
            </ThemeIcon>
            <Text size="xs" style={{ overflowWrap: "anywhere" }}>
              {badge.label}
            </Text>
          </Group>
        );
      })}
    </Stack>
  );
}

interface TokenDetailProps extends Pick<
  PaperProps,
  "top" | "right" | "bottom" | "left" | "w" | "mah"
> {
  tokenId: string;
  // Clicks there keep the detail, so the images in the list can switch it.
  listArea: HTMLElement | null;
  onClose: () => void;
}

// Beside the token list. The caller places it.
export function TokenDetail({
  tokenId,
  listArea,
  onClose,
  ...placement
}: TokenDetailProps) {
  const token = useShownToken(tokenId);
  const panelRef = useClickOutside<HTMLDivElement>(
    (event) => {
      const path = event.composedPath();
      // Menus and dialogs lie outside the app root, so marking the token keeps its detail open.
      const appRoot = document.getElementById("root");
      if (!appRoot) throw new Error("Root element #root not found");
      if (path.includes(appRoot) && !(listArea && path.includes(listArea))) {
        onClose();
      }
    },
    // One event for mouse, pen and finger alike.
    ["pointerdown"],
  );
  useHotkeys([["Escape", onClose]]);
  if (!token) return null;

  return (
    <FloatingPanel
      ref={panelRef}
      pos="absolute"
      p="sm"
      // Also on wide screens, where the panel column around it lets clicks through to the map.
      style={{
        overflowY: "auto",
        scrollbarWidth: "thin",
        pointerEvents: "auto",
      }}
      {...placement}
    >
      <TokenDetailContent token={token} />
    </FloatingPanel>
  );
}
