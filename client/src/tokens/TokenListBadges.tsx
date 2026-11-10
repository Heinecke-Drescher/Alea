import { Group, Text, ThemeIcon, Tooltip } from "@mantine/core";
import { tokenEffects } from "../room/effects";
import { tokenMarks } from "../room/marks";
import type { Token } from "../room/roomStore";
import { badgeIcon, fitBadges, tokenBadges } from "./badgeIcons";

// Like on the map, the badges sit in the upper right corner of the image, where there is room
// for two.
const BADGE_PLACES = 2;
const BADGE_SIZE = 16;
// Sets each badge off the image under it.
const BADGE_BORDER = "1.5px solid var(--mantine-color-body)";

export function TokenListBadges({ token }: { token: Token }) {
  const { shown, hidden } = fitBadges(
    tokenBadges(tokenEffects(token), tokenMarks(token)),
    BADGE_PLACES,
  );
  if (shown.length === 0) return null;
  const hiddenLabels = hidden.map((badge) => badge.label).join(", ");

  return (
    <Group gap={2} wrap="nowrap" pos="absolute" top={0} right={0}>
      {shown.map((badge) => {
        const BadgeIcon = badgeIcon(badge.icon);
        return (
          <Tooltip key={badge.key} label={badge.label}>
            <ThemeIcon
              size={BADGE_SIZE}
              style={{ border: BADGE_BORDER }}
              radius="xl"
              color={`${badge.color}.8`}
              role="img"
              aria-label={badge.label}
            >
              <BadgeIcon size={10} />
            </ThemeIcon>
          </Tooltip>
        );
      })}
      {hidden.length > 0 && (
        <Tooltip label={hiddenLabels}>
          <ThemeIcon
            size={BADGE_SIZE}
            style={{ border: BADGE_BORDER }}
            radius="xl"
            color="gray.8"
            role="img"
            aria-label={hiddenLabels}
          >
            <Text size={hidden.length < 10 ? "10px" : "8px"} fw={700} lh={1}>
              +{hidden.length}
            </Text>
          </ThemeIcon>
        </Tooltip>
      )}
    </Group>
  );
}
