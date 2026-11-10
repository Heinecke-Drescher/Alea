import { Avatar, Group, Stack, Text, ThemeIcon } from "@mantine/core";
import { FloatingPanel } from "../FloatingPanel";
import { useFogGuard } from "../fog/useFogGuard";
import { isOutOfFight, tokenEffects } from "../room/effects";
import { tokenMarks } from "../room/marks";
import { embeddedImage } from "../room/tokens";
import { useRoom } from "../room/RoomContext";
import { useY } from "../room/useY";
import { badgeIcon, tokenBadges } from "./badgeIcons";
import { SHEET_WIDTH } from "./TokenSheet";
import { TOKENS_TOGGLE_SPACE } from "./TokensToggle";

const IMAGE_SIZE = 96;

// Beside the token sheet, where the map stays visible above, it shows one token with every status
// and the full text of every mark, which the badges have no room for.
export function TokenDetail({ tokenId }: { tokenId: string }) {
  const room = useRoom();
  const fogGuard = useFogGuard();
  const token = useY(room.tokensMap)[tokenId];
  const images = useY(room.imagesMap);
  // Someone may have removed it or hidden it under the fog meanwhile.
  if (!token || fogGuard.hidesSquare(token)) return null;
  const badges = tokenBadges(tokenEffects(token), tokenMarks(token));

  return (
    <FloatingPanel
      pos="absolute"
      left={12}
      right={`calc(${SHEET_WIDTH} + 24px)`}
      bottom={TOKENS_TOGGLE_SPACE}
      mah="50%"
      p="sm"
      style={{ overflowY: "auto", scrollbarWidth: "thin" }}
    >
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
    </FloatingPanel>
  );
}
