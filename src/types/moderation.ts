// ─── Warning System ───────────────────────────────────────────────
export type WarningLevel = 1 | 2;

export interface Warning {
  id: string;
  playerId: string;
  kickUsername: string;
  level: WarningLevel;
  reason: string;
  issuedAt: string; // ISO string for JSON serialization
  issuedBy: string;
}

// ─── Punishment System ────────────────────────────────────────────
export type PunishmentDuration =
  | "1_game"
  | "2_game"
  | "1_day"
  | "1_week"
  | "custom";

export interface PunishmentDurationOption {
  value: PunishmentDuration;
  label: string;
  description: string;
}

export interface Punishment {
  id: string;
  playerId: string;
  kickUsername: string;
  duration: PunishmentDuration;
  customDurationMs?: number; // for custom duration in milliseconds
  customDurationLabel?: string; // human-readable label for custom
  reason: string;
  issuedAt: string;
  expiresAt: string | null; // null for game-based
  issuedBy: string;
  isActive: boolean;
  gamesServed?: number;
}

// ─── Ban System ───────────────────────────────────────────────────
export type BanDuration = "1_month" | "permanent";

export interface BanDurationOption {
  value: BanDuration;
  label: string;
  description: string;
}

export interface Ban {
  id: string;
  playerId: string;
  kickUsername: string;
  duration: BanDuration;
  reason: string;
  issuedAt: string;
  expiresAt: string | null; // null for permanent
  issuedBy: string;
  isActive: boolean;
}

// ─── Respect Points ──────────────────────────────────────────────
export interface RespectScore {
  kickUsername: string;
  points: number; // 0–100, starts at 100
  totalWarnings: number;
  totalPunishments: number;
  totalBans: number;
}

// ─── Unified Moderation Record ────────────────────────────────────
export type ModerationActionType = "warning" | "punishment" | "ban";

export interface ModerationRecord {
  id: string;
  kickUsername: string;
  warnings: Warning[];
  punishments: Punishment[];
  bans: Ban[];
  currentWarningLevel: 0 | 1 | 2;
  respectScore: RespectScore;
}

// ─── Moderation Store (localStorage shape) ───────────────────────
export interface ModerationStore {
  warnings: Warning[];
  punishments: Punishment[];
  bans: Ban[];
  respectScores: Record<string, RespectScore>;
}
