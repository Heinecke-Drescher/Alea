import { Group, ThemeIcon, Tooltip } from "@mantine/core";
import { tokenEffects } from "../room/effects";
import { tokenMark } from "../room/mark";
import type { Token } from "../room/roomStore";
import { badgeIcon, tokenBadges } from "./badgeIcons";

export function TokenListBadges({ token }: { token: Token }) {
  const badges = tokenBadges(tokenEffects(token), tokenMark(token));
  if (badges.length === 0) return null;

  return (
    <Group gap={2} wrap="nowrap">
      {badges.map((badge) => {
        const BadgeIcon = badgeIcon(badge.kind);
        return (
          <Tooltip key={badge.kind} label={badge.label}>
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
    </Group>
  );
}
