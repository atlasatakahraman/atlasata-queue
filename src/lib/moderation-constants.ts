import type { PunishmentDurationOption, BanDurationOption } from "@/types/moderation";

export const PUNISHMENT_DURATIONS: PunishmentDurationOption[] = [
  { value: "1_game",  label: "1 Maç",     description: "1 Maç" },
  { value: "2_game",  label: "2 Maç",     description: "2 Maç" },
  { value: "1_day",   label: "1 Gün",     description: "1 gün" },
  { value: "1_week",  label: "1 Hafta",   description: "7 gün" },
  { value: "custom",  label: "Özel Süre", description: "Özel süre belirle" },
];

export const BAN_DURATIONS: BanDurationOption[] = [
  { value: "1_month",   label: "1 Ay",    description: "30 gün yasaklama" },
  { value: "permanent", label: "Kalıcı",  description: "Kalıcı yasaklama" },
];

export const WARNING_LEVELS = [
  { level: 1, label: "1. Uyarı", color: "warning" as const },
  { level: 2, label: "2. Uyarı", color: "destructive" as const },
] as const;

// ─── Respect Score Deductions ─────────────────────────────────────
// Each action type deducts points from the player's respect score.
// Players start at 100 points.
export const RESPECT_DEDUCTIONS = {
  warning: 10,      // -10 per warning
  punishment: 20,   // -20 per punishment
  ban: 50,          // -50 per ban
} as const;

export const MODERATION_STORAGE_KEY = "atlas-moderation" as const;

// ─── Moderation Tab Items ─────────────────────────────────────────
// Dataset-driven sub-tabs: add new tabs here without touching components
export const MODERATION_TABS = [
  { value: "warnings",    label: "Uyarılar",   icon: "AlertTriangle" },
  { value: "punishments", label: "Cezalar",     icon: "Clock" },
  { value: "bans",        label: "Yasaklılar",  icon: "Ban" },
  { value: "history",     label: "Geçmiş",      icon: "History" },
] as const;
