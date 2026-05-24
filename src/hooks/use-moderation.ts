"use client";

import {
  MODERATION_STORAGE_KEY,
  RESPECT_DEDUCTIONS,
} from "@/lib/moderation-constants";
import type {
  Ban,
  BanDuration,
  ModerationRecord,
  ModerationStore,
  Punishment,
  PunishmentDuration,
  RespectScore,
  Warning,
  WarningLevel,
} from "@/types/moderation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const EMPTY_STORE: ModerationStore = {
  warnings: [],
  punishments: [],
  bans: [],
  respectScores: {},
};

export function formatDuration(duration: string): string {
  const mapping: Record<string, string> = {
    "1_game": "1 Oyun",
    "2_game": "2 Oyun",
    "1_day": "1 Gün",
    "1_week": "1 Hafta",
    "1_month": "1 Ay",
    permanent: "Kalıcı",
    custom: "Özel",
  };
  return mapping[duration] ?? duration.replace("_", " ");
}

function loadStore(): ModerationStore {
  try {
    const raw = localStorage.getItem(MODERATION_STORAGE_KEY);
    if (raw) {
      return { ...EMPTY_STORE, ...JSON.parse(raw) };
    }
  } catch {
    /* ignore */
  }
  return { ...EMPTY_STORE };
}

function saveStore(store: ModerationStore) {
  try {
    localStorage.setItem(MODERATION_STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

function computeRespect(
  kickUsername: string,
  warnings: Warning[],
  punishments: Punishment[],
  bans: Ban[],
): RespectScore {
  const userWarnings = warnings.filter(
    (w) => w.kickUsername.toLowerCase() === kickUsername.toLowerCase(),
  );
  const userPunishments = punishments.filter(
    (p) => p.kickUsername.toLowerCase() === kickUsername.toLowerCase(),
  );
  const userBans = bans.filter(
    (b) => b.kickUsername.toLowerCase() === kickUsername.toLowerCase(),
  );

  const deduction =
    userWarnings.length * RESPECT_DEDUCTIONS.warning +
    userPunishments.length * RESPECT_DEDUCTIONS.punishment +
    userBans.length * RESPECT_DEDUCTIONS.ban;

  return {
    kickUsername,
    points: Math.max(0, Math.min(100, 100 - deduction)),
    totalWarnings: userWarnings.length,
    totalPunishments: userPunishments.length,
    totalBans: userBans.length,
  };
}

function computeExpiresAt(
  duration: PunishmentDuration,
  customDurationMs?: number,
): string | null {
  const now = Date.now();
  switch (duration) {
    case "1_game":
    case "2_game":
      return null; // game-based, no time expiry
    case "1_day":
      return new Date(now + 24 * 60 * 60 * 1000).toISOString();
    case "1_week":
      return new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
    case "custom":
      if (customDurationMs) {
        return new Date(now + customDurationMs).toISOString();
      }
      return null;
    default:
      return null;
  }
}

function computeBanExpiresAt(duration: BanDuration): string | null {
  if (duration === "permanent") return null;
  // 1_month → 30 days
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
}

export function useModeration() {
  const [store, setStore] = useState<ModerationStore>(EMPTY_STORE);
  const hasLoadedRef = useRef(false);

  // Load from localStorage on mount (permanent, not per-session)
  useEffect(() => {
    const loaded = loadStore();
    setStore(loaded);
    hasLoadedRef.current = true;
  }, []);

  // Save to localStorage whenever store changes (after initial load)
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    saveStore(store);
  }, [store]);

  // ─── Issue Warning ─────────────────────────────────────────────
  const issueWarning = useCallback(
    (
      kickUsername: string,
      reason: string,
      issuedBy: string = "Admin",
    ): {
      warning: Warning | null;
      shouldEscalate: boolean;
      automaticallyPunished?: boolean;
    } => {
      const existing = store.warnings.filter(
        (w) => w.kickUsername.toLowerCase() === kickUsername.toLowerCase(),
      );

      if (existing.length >= 1) {
        // Reached warning level 2. Remove remaining warnings and issue a 1_game punishment.
        const punishment: Punishment = {
          id: crypto.randomUUID(),
          playerId: kickUsername,
          kickUsername,
          duration: "1_game",
          reason: `2. Uyarı Sınırı Aşıldı (${reason})`,
          issuedAt: new Date().toISOString(),
          expiresAt: null,
          issuedBy: "Sistem",
          isActive: true,
          gamesServed: 0,
        };

        setStore((prev) => {
          const next = {
            ...prev,
            warnings: prev.warnings.filter(
              (w) =>
                w.kickUsername.toLowerCase() !== kickUsername.toLowerCase(),
            ),
            punishments: [
              ...prev.punishments.filter(
                (p) =>
                  p.kickUsername.toLowerCase() !== kickUsername.toLowerCase(),
              ),
              punishment,
            ],
            bans: prev.bans.filter(
              (b) =>
                b.kickUsername.toLowerCase() !== kickUsername.toLowerCase(),
            ),
          };
          const respect = computeRespect(
            kickUsername,
            next.warnings,
            next.punishments,
            next.bans,
          );
          next.respectScores = {
            ...prev.respectScores,
            [kickUsername.toLowerCase()]: respect,
          };
          return next;
        });

        return {
          warning: null,
          shouldEscalate: false,
          automaticallyPunished: true,
        };
      }

      const level: WarningLevel = existing.length >= 1 ? 2 : 1;

      const warning: Warning = {
        id: crypto.randomUUID(),
        playerId: kickUsername,
        kickUsername,
        level,
        reason,
        issuedAt: new Date().toISOString(),
        issuedBy,
      };

      setStore((prev) => {
        const next = {
          ...prev,
          warnings: [
            ...prev.warnings.filter(
              (w) => w.kickUsername.toLowerCase() !== kickUsername.toLowerCase()
            ),
            warning,
          ],
          punishments: prev.punishments.filter(
            (p) => p.kickUsername.toLowerCase() !== kickUsername.toLowerCase()
          ),
          bans: prev.bans.filter(
            (b) => b.kickUsername.toLowerCase() !== kickUsername.toLowerCase()
          ),
        };
        // Recalculate respect score
        const respect = computeRespect(
          kickUsername,
          next.warnings,
          next.punishments,
          next.bans,
        );
        next.respectScores = {
          ...prev.respectScores,
          [kickUsername.toLowerCase()]: respect,
        };
        return next;
      });

      return {
        warning,
        shouldEscalate: level >= 2,
        automaticallyPunished: false,
      };
    },
    [store.warnings],
  );

  // ─── Issue Punishment ──────────────────────────────────────────
  const issuePunishment = useCallback(
    (
      kickUsername: string,
      duration: PunishmentDuration,
      reason: string,
      issuedBy: string = "Admin",
      customDurationMs?: number,
      customDurationLabel?: string,
    ): Punishment => {
      const punishment: Punishment = {
        id: crypto.randomUUID(),
        playerId: kickUsername,
        kickUsername,
        duration,
        customDurationMs,
        customDurationLabel,
        reason,
        issuedAt: new Date().toISOString(),
        expiresAt: computeExpiresAt(duration, customDurationMs),
        issuedBy,
        isActive: true,
        gamesServed: 0,
      };

      setStore((prev) => {
        const next = {
          ...prev,
          warnings: prev.warnings.filter(
            (w) => w.kickUsername.toLowerCase() !== kickUsername.toLowerCase()
          ),
          punishments: [
            ...prev.punishments.filter(
              (p) => p.kickUsername.toLowerCase() !== kickUsername.toLowerCase()
            ),
            punishment,
          ],
          bans: prev.bans.filter(
            (b) => b.kickUsername.toLowerCase() !== kickUsername.toLowerCase()
          ),
        };
        const respect = computeRespect(
          kickUsername,
          next.warnings,
          next.punishments,
          next.bans,
        );
        next.respectScores = {
          ...prev.respectScores,
          [kickUsername.toLowerCase()]: respect,
        };
        return next;
      });

      return punishment;
    },
    [],
  );

  // ─── Issue Ban ─────────────────────────────────────────────────
  const issueBan = useCallback(
    (
      kickUsername: string,
      duration: BanDuration,
      reason: string,
      issuedBy: string = "Admin",
    ): Ban => {
      const ban: Ban = {
        id: crypto.randomUUID(),
        playerId: kickUsername,
        kickUsername,
        duration,
        reason,
        issuedAt: new Date().toISOString(),
        expiresAt: computeBanExpiresAt(duration),
        issuedBy,
        isActive: true,
      };

      setStore((prev) => {
        const next = {
          ...prev,
          warnings: prev.warnings.filter(
            (w) => w.kickUsername.toLowerCase() !== kickUsername.toLowerCase()
          ),
          punishments: prev.punishments.filter(
            (p) => p.kickUsername.toLowerCase() !== kickUsername.toLowerCase()
          ),
          bans: [...prev.bans, ban],
        };
        const respect = computeRespect(
          kickUsername,
          next.warnings,
          next.punishments,
          next.bans,
        );
        next.respectScores = {
          ...prev.respectScores,
          [kickUsername.toLowerCase()]: respect,
        };
        return next;
      });

      return ban;
    },
    [],
  );

  // ─── Revoke Operations ─────────────────────────────────────────
  const revokeWarning = useCallback((id: string) => {
    setStore((prev) => {
      const next = {
        ...prev,
        warnings: prev.warnings.filter((w) => w.id !== id),
      };
      // Recompute all affected respect scores
      const affected = prev.warnings.find((w) => w.id === id);
      if (affected) {
        const respect = computeRespect(
          affected.kickUsername,
          next.warnings,
          next.punishments,
          next.bans,
        );
        next.respectScores = {
          ...prev.respectScores,
          [affected.kickUsername.toLowerCase()]: respect,
        };
      }
      return next;
    });
  }, []);

  const revokePunishment = useCallback((id: string) => {
    setStore((prev) => {
      const target = prev.punishments.find((p) => p.id === id);
      const next = {
        ...prev,
        punishments: prev.punishments.map((p) =>
          p.id === id ? { ...p, isActive: false } : p,
        ),
      };
      if (target) {
        const respect = computeRespect(
          target.kickUsername,
          next.warnings,
          next.punishments,
          next.bans,
        );
        next.respectScores = {
          ...prev.respectScores,
          [target.kickUsername.toLowerCase()]: respect,
        };
      }
      return next;
    });
  }, []);

  const revokeBan = useCallback((id: string) => {
    setStore((prev) => {
      const target = prev.bans.find((b) => b.id === id);
      const next = {
        ...prev,
        bans: prev.bans.map((b) =>
          b.id === id ? { ...b, isActive: false } : b,
        ),
      };
      if (target) {
        const respect = computeRespect(
          target.kickUsername,
          next.warnings,
          next.punishments,
          next.bans,
        );
        next.respectScores = {
          ...prev.respectScores,
          [target.kickUsername.toLowerCase()]: respect,
        };
      }
      return next;
    });
  }, []);

  const deleteHistoryItem = useCallback(
    (id: string, type: "warning" | "punishment" | "ban") => {
      setStore((prev) => {
        const next = { ...prev };
        let affectedUsername: string | undefined = undefined;

        if (type === "warning") {
          const found = prev.warnings.find((w) => w.id === id);
          if (found) affectedUsername = found.kickUsername;
          next.warnings = prev.warnings.filter((w) => w.id !== id);
        } else if (type === "punishment") {
          const found = prev.punishments.find((p) => p.id === id);
          if (found) affectedUsername = found.kickUsername;
          next.punishments = prev.punishments.filter((p) => p.id !== id);
        } else if (type === "ban") {
          const found = prev.bans.find((b) => b.id === id);
          if (found) affectedUsername = found.kickUsername;
          next.bans = prev.bans.filter((b) => b.id !== id);
        }

        if (affectedUsername) {
          const respect = computeRespect(
            affectedUsername,
            next.warnings,
            next.punishments,
            next.bans,
          );
          next.respectScores = {
            ...prev.respectScores,
            [affectedUsername.toLowerCase()]: respect,
          };
        }
        return next;
      });
    },
    [],
  );

  const clearAllHistory = useCallback(() => {
    setStore((prev) => {
      const next = {
        ...prev,
        warnings: [],
        punishments: [],
        bans: [],
        respectScores: {},
      };
      return next;
    });
  }, []);

  // ─── Query Operations ──────────────────────────────────────────
  const getPlayerRecord = useCallback(
    (kickUsername: string): ModerationRecord => {
      const key = kickUsername.toLowerCase();
      const warnings = store.warnings.filter(
        (w) => w.kickUsername.toLowerCase() === key,
      );
      const punishments = store.punishments.filter(
        (p) => p.kickUsername.toLowerCase() === key,
      );
      const bans = store.bans.filter(
        (b) => b.kickUsername.toLowerCase() === key,
      );
      const currentWarningLevel = Math.min(2, warnings.length) as 0 | 1 | 2;
      const respectScore =
        store.respectScores[key] ??
        computeRespect(kickUsername, warnings, punishments, bans);

      return {
        id: key,
        kickUsername,
        warnings,
        punishments,
        bans,
        currentWarningLevel,
        respectScore,
      };
    },
    [store],
  );

  const isPlayerBanned = useCallback(
    (kickUsername: string): boolean => {
      const key = kickUsername.toLowerCase();
      const now = new Date().toISOString();
      return store.bans.some(
        (b) =>
          b.kickUsername.toLowerCase() === key &&
          b.isActive &&
          (b.expiresAt === null || b.expiresAt > now),
      );
    },
    [store.bans],
  );

  const isPlayerPunished = useCallback(
    (kickUsername: string): boolean => {
      const key = kickUsername.toLowerCase();
      const now = new Date().toISOString();
      return store.punishments.some(
        (p) =>
          p.kickUsername.toLowerCase() === key &&
          p.isActive &&
          (p.expiresAt === null || p.expiresAt > now),
      );
    },
    [store.punishments],
  );

  const getRespectScore = useCallback(
    (kickUsername: string): number => {
      const key = kickUsername.toLowerCase();
      return store.respectScores[key]?.points ?? 100;
    },
    [store.respectScores],
  );

  const getActiveModeration = useCallback(() => {
    const now = new Date().toISOString();
    return {
      activeWarnings: store.warnings,
      activePunishments: store.punishments.filter(
        (p) => p.isActive && (p.expiresAt === null || p.expiresAt > now),
      ),
      activeBans: store.bans.filter(
        (b) => b.isActive && (b.expiresAt === null || b.expiresAt > now),
      ),
    };
  }, [store]);

  // ─── All-time history (sorted by date, newest first) ───────────
  const history = useMemo(() => {
    const items: Array<{
      type: "warning" | "punishment" | "ban";
      id: string;
      kickUsername: string;
      reason: string;
      issuedAt: string;
      detail: string;
    }> = [];

    for (const w of store.warnings) {
      items.push({
        type: "warning",
        id: w.id,
        kickUsername: w.kickUsername,
        reason: w.reason,
        issuedAt: w.issuedAt,
        detail: `${w.level}. Uyarı`,
      });
    }
    for (const p of store.punishments) {
      items.push({
        type: "punishment",
        id: p.id,
        kickUsername: p.kickUsername,
        reason: p.reason,
        issuedAt: p.issuedAt,
        detail: p.customDurationLabel ?? formatDuration(p.duration),
      });
    }
    for (const b of store.bans) {
      items.push({
        type: "ban",
        id: b.id,
        kickUsername: b.kickUsername,
        reason: b.reason,
        issuedAt: b.issuedAt,
        detail: formatDuration(b.duration),
      });
    }

    return items.sort(
      (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
    );
  }, [store]);

  return {
    // State
    warnings: store.warnings,
    punishments: store.punishments,
    bans: store.bans,
    respectScores: store.respectScores,
    history,

    // Actions
    issueWarning,
    issuePunishment,
    issueBan,
    revokeWarning,
    revokePunishment,
    revokeBan,
    deleteHistoryItem,
    clearAllHistory,

    // Queries
    getPlayerRecord,
    isPlayerBanned,
    isPlayerPunished,
    getRespectScore,
    getActiveModeration,
  };
}
