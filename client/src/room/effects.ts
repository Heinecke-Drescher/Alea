import type { Token } from "./roomStore";

export const STATUS_EFFECTS = ["dead", "unconscious"] as const;

export type StatusEffect = (typeof STATUS_EFFECTS)[number];

export function isStatusEffect(value: unknown): value is StatusEffect {
  return STATUS_EFFECTS.some((effect) => effect === value);
}

export function tokenEffects({
  effects,
}: {
  effects?: unknown;
}): StatusEffect[] {
  if (!Array.isArray(effects)) return [];
  return STATUS_EFFECTS.filter((effect) => effects.includes(effect));
}

// Dead or unconscious tokens are out of the fight and shown in gray.
export function isOutOfFight(token: Token): boolean {
  return tokenEffects(token).length > 0;
}
