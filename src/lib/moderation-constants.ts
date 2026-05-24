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

// ─── Respect Tier Labels ──────────────────────────────────────────
// Tiers are evaluated top-down: the first matching threshold wins.
export const RESPECT_TIERS = [
  { min: 90, label: "Mükemmel", color: "text-success", barColor: "bg-success" },
  { min: 70, label: "İyi", color: "text-success", barColor: "bg-success" },
  { min: 50, label: "Dikkat", color: "text-cl-warning", barColor: "bg-cl-warning" },
  { min: 30, label: "Riskli", color: "text-cl-punishment", barColor: "bg-cl-punishment" },
  { min: 0, label: "Tehlikeli", color: "text-cl-banned", barColor: "bg-cl-banned" },
] as const;

export function getRespectTier(points: number) {
  return RESPECT_TIERS.find((t) => points >= t.min) ?? RESPECT_TIERS[RESPECT_TIERS.length - 1];
}

// ─── Time Decay ───────────────────────────────────────────────────
// Offenses lose impact over time — incentivizes good behavior.
// Factor is multiplied against the base deduction.
export const RESPECT_DECAY_THRESHOLDS = [
  { daysAgo: 30, factor: 0.25 },  // older than 30 days → 25% impact
  { daysAgo: 14, factor: 0.5 },   // older than 14 days → 50% impact
  { daysAgo: 7, factor: 0.75 },   // older than 7 days → 75% impact
  { daysAgo: 0, factor: 1.0 },    // recent → full impact
] as const;

export function getDecayFactor(issuedAt: string): number {
  const daysAgo = (Date.now() - new Date(issuedAt).getTime()) / (1000 * 60 * 60 * 24);
  for (const threshold of RESPECT_DECAY_THRESHOLDS) {
    if (daysAgo >= threshold.daysAgo) return threshold.factor;
  }
  return 1.0;
}

// ─── Escalation ───────────────────────────────────────────────────
// Repeat offenders get hit harder: Nth offense = base × escalation[N-1]
export const ESCALATION_MULTIPLIERS = [1.0, 1.0, 1.5, 2.0, 2.5] as const;

export function getEscalationMultiplier(offenseIndex: number): number {
  if (offenseIndex < ESCALATION_MULTIPLIERS.length) {
    return ESCALATION_MULTIPLIERS[offenseIndex];
  }
  return ESCALATION_MULTIPLIERS[ESCALATION_MULTIPLIERS.length - 1];
}

export const MODERATION_STORAGE_KEY = "atlas-moderation" as const;

// ─── Moderation Tab Items ─────────────────────────────────────────
// Dataset-driven sub-tabs: add new tabs here without touching components
export const MODERATION_TABS = [
  { value: "warnings",    label: "Uyarılar",   icon: "AlertTriangle" },
  { value: "punishments", label: "Cezalar",     icon: "Clock" },
  { value: "bans",        label: "Yasaklılar",  icon: "Ban" },
  { value: "history",     label: "Geçmiş",      icon: "History" },
] as const;
