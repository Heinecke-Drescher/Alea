import type { Token } from "./roomStore";

export const STATUS_EFFECTS = ["dead", "unconscious"] as const;

export type StatusEffect = (typeof STATUS_EFFECTS)[number];

export function isStatusEffect(value: unknown): value is StatusEffect {
  return STATUS_EFFECTS.some((effect) => effect === value);
}

export function tokenEffects(token: Token): StatusEffect[] {
  const { effects } = token;
  if (!Array.isArray(effects)) return [];
  return STATUS_EFFECTS.filter((effect) => effects.includes(effect));
}
