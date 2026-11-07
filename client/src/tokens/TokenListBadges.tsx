import { Group, Text, ThemeIcon, Tooltip } from "@mantine/core";
import { tokenEffects } from "../room/effects";
import { tokenMarks } from "../room/marks";
import type { Token } from "../room/roomStore";
import { badgeIcon, fitBadges, tokenBadges } from "./badgeIcons";

// More badges would squeeze the name out of a narrow list.
const BADGE_PLACES = 4;

export function TokenListBadges({ token }: { token: Token }) {
  const { shown, hidden } = fitBadges(
    tokenBadges(tokenEffects(token), tokenMarks(token)),
    BADGE_PLACES,
  );
  if (shown.length === 0) return null;
  const hiddenLabels = hidden.map((badge) => badge.label).join(", ");

  return (
    <Group gap={2} wrap="nowrap">
      {shown.map((badge) => {
        const BadgeIcon = badgeIcon(badge.kind);
        return (
          <Tooltip key={badge.key} label={badge.label}>
            <ThemeIcon
              size={18}
              radius="xl"
              color={`${badge.color}.8`}
              role="img"
              aria-label={badge.label}
            >
              <BadgeIcon size={12} />
            </ThemeIcon>
          </Tooltip>
        );
      })}
      {hidden.length > 0 && (
        <Tooltip label={hiddenLabels}>
          <ThemeIcon
            size={18}
            radius="xl"
            color="gray.8"
            role="img"
            aria-label={hiddenLabels}
          >
            <Text size="10px" fw={700} lh={1}>
              +{hidden.length}
            </Text>
          </ThemeIcon>
        </Tooltip>
      )}
    </Group>
  );
}
