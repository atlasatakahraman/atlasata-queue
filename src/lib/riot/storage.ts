"use client";

import type {
  TrackedRiotAccount,
  TrackingSession,
  MatchResult,
} from "./types";

const STORAGE_VERSION = 1;

const KEYS = {
  trackedAccount: "theatlas_tracked_account",
  trackingSession: "theatlas_tracking_session",
  matchHistory: "theatlas_match_history",
  storageVersion: "theatlas_storage_version",
} as const;

const MAX_HISTORY_LENGTH = 50;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function safeGet<T>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: unknown): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

function safeRemove(key: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/** Stamp storage version on first use; add migrations here in future versions. */
export function migrateStorage(): void {
  if (!isBrowser()) return;
  const version = safeGet<number>(KEYS.storageVersion);
  if (version === STORAGE_VERSION) return;
  safeSet(KEYS.storageVersion, STORAGE_VERSION);
}

// ─── Tracked Account ──────────────────────────────────────────

export function getTrackedAccount(): TrackedRiotAccount | null {
  return safeGet<TrackedRiotAccount>(KEYS.trackedAccount);
}

export function setTrackedAccount(account: TrackedRiotAccount): void {
  safeSet(KEYS.trackedAccount, account);
}

/**
 * Clears the tracked account AND its associated session.
 * Callers should NOT additionally call clearTrackingSession() — it is done here.
 */
export function clearTrackedAccount(): void {
  safeRemove(KEYS.trackedAccount);
  safeRemove(KEYS.trackingSession);
}

// ─── Tracking Session ─────────────────────────────────────────

export function getTrackingSession(): TrackingSession | null {
  return safeGet<TrackingSession>(KEYS.trackingSession);
}

export function setTrackingSession(session: TrackingSession): void {
  safeSet(KEYS.trackingSession, session);
}

export function clearTrackingSession(): void {
  safeRemove(KEYS.trackingSession);
}

export function createDefaultSession(puuid: string): TrackingSession {
  return {
    state: "polling",
    trackedPuuid: puuid,
    activeGame: null,
    gameEndedAt: null,
    matchCheckCount: 0,
    lastCheckedAt: null,
    error: null,
  };
}

// ─── Match History ────────────────────────────────────────────

export function getMatchHistory(): MatchResult[] {
  return safeGet<MatchResult[]>(KEYS.matchHistory) ?? [];
}

export function addMatchToHistory(match: MatchResult): void {
  const history = getMatchHistory();

  // Deduplicate by matchId
  if (history.some((m) => m.matchId === match.matchId)) return;

  const updated = [match, ...history].slice(0, MAX_HISTORY_LENGTH);
  safeSet(KEYS.matchHistory, updated);
}

export function clearMatchHistory(): void {
  safeRemove(KEYS.matchHistory);
}
