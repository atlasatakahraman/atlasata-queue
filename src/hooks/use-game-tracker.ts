"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  TrackedRiotAccount,
  TrackingSession,
  MatchResult,
} from "@/lib/riot/types";
import type { RiotRegion } from "@/types";
import { REGION_TO_ROUTING } from "@/types";
import {
  getTrackedAccount,
  setTrackedAccount,
  clearTrackedAccount,
  getTrackingSession,
  setTrackingSession,
  clearTrackingSession,
  createDefaultSession,
  getMatchHistory,
  addMatchToHistory,
  clearMatchHistory,
  migrateStorage,
} from "@/lib/riot/storage";

export interface UseGameTrackerReturn {
  trackedAccount: TrackedRiotAccount | null;
  session: TrackingSession | null;
  matchHistory: MatchResult[];
  latestMatch: MatchResult | null;
  isResolving: boolean;
  isTracking: boolean;
  isFetchingMatches: boolean;
  resolveAndTrack: (
    gameName: string,
    tagLine: string,
    region: RiotRegion,
  ) => Promise<boolean>;
  stopTracking: () => void;
  clearHistory: () => void;
  dismissLatestMatch: () => void;
  fetchRecentMatches: (
    silent?: boolean,
    forcedAccount?: TrackedRiotAccount,
  ) => Promise<number>;
  selectMatch: (match: MatchResult) => void;
}

export function useGameTracker(): UseGameTrackerReturn {
  const [trackedAccount, setTrackedAccountState] =
    useState<TrackedRiotAccount | null>(null);
  const [session, setSessionState] = useState<TrackingSession | null>(null);
  const [matchHistory, setMatchHistoryState] = useState<MatchResult[]>([]);
  const [latestMatch, setLatestMatch] = useState<MatchResult | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isFetchingMatches, setIsFetchingMatches] = useState(false);

  // Stable ref so callbacks never go stale due to state closure
  const trackedAccountRef = useRef<TrackedRiotAccount | null>(null);
  trackedAccountRef.current = trackedAccount;

  // Initialize from localStorage on mount only
  useEffect(() => {
    migrateStorage();

    const stored = getTrackedAccount();
    const storedSession = getTrackingSession();
    const storedHistory = getMatchHistory();

    setTrackedAccountState(stored);
    setSessionState(storedSession);
    setMatchHistoryState(storedHistory);
  }, []); // Empty dep array — runs once on mount

  /**
   * Manually fetch recent matches and persist new ones to history.
   * Returns the number of new matches added.
   */
  const fetchRecentMatches = useCallback(
    async (
      silent = false,
      forcedAccount?: TrackedRiotAccount,
    ): Promise<number> => {
      const account = forcedAccount ?? trackedAccountRef.current;
      if (!account) return 0;

      if (!silent) setIsFetchingMatches(true);

      try {
        const matchListRes = await fetch("/api/riot/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            puuid: account.puuid,
            region: account.region,
            count: 5,
          }),
        });

        if (!matchListRes.ok) {
          if (!silent) setIsFetchingMatches(false);
          return 0;
        }

        const { matchIds } = (await matchListRes.json()) as {
          matchIds: string[];
        };
        const existingHistory = getMatchHistory();
        const existingIds = new Set(existingHistory.map((m) => m.matchId));
        let added = 0;
        let newestMatch: MatchResult | null = null;

        for (const matchId of matchIds) {
          if (existingIds.has(matchId)) continue;

          const matchRes = await fetch("/api/riot/match", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              matchId,
              puuid: account.puuid,
              region: account.region,
            }),
          });

          if (!matchRes.ok) continue;

          const { match } = (await matchRes.json()) as { match: MatchResult };
          addMatchToHistory(match);
          added++;

          // Track the most recent new match to surface as latestMatch
          if (
            !newestMatch ||
            match.gameStartTimestamp > newestMatch.gameStartTimestamp
          ) {
            newestMatch = match;
          }
        }

        if (added > 0) {
          const updatedHistory = getMatchHistory();
          setMatchHistoryState(updatedHistory);
        } else {
          // Still sync history in case another tab wrote something
          const currentHistory = getMatchHistory();
          setMatchHistoryState(currentHistory);
        }

        // Always display the newest game result in the detail card
        const finalHistory = getMatchHistory();
        if (finalHistory.length > 0) {
          setLatestMatch(finalHistory[0]);
        }

        if (!silent) setIsFetchingMatches(false);
        return added;
      } catch {
        if (!silent) setIsFetchingMatches(false);
        return 0;
      }
    },
    [],
  );

  const resolveAndTrack = useCallback(
    async (
      gameName: string,
      tagLine: string,
      region: RiotRegion,
    ): Promise<boolean> => {
      setIsResolving(true);

      try {
        const res = await fetch("/api/riot/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameName, tagLine, region }),
        });

        if (!res.ok) {
          setIsResolving(false);
          return false;
        }

        const data = (await res.json()) as {
          gameName: string;
          tagLine: string;
          puuid: string;
          encryptedSummonerId?: string;
          profileIconId?: number;
        };

        const account: TrackedRiotAccount = {
          gameName: data.gameName,
          tagLine: data.tagLine,
          puuid: data.puuid,
          encryptedSummonerId: data.encryptedSummonerId ?? "",
          region,
          routingRegion: REGION_TO_ROUTING[region],
          profileIconId: data.profileIconId,
          resolvedAt: new Date().toISOString(),
        };

        setTrackedAccount(account);
        setTrackedAccountState(account);

        const newSession = createDefaultSession(account.puuid);
        setTrackingSession(newSession);
        setSessionState(newSession);

        setIsResolving(false);

        // Fetch match history immediately
        setTimeout(() => {
          fetchRecentMatches(false, account).catch(console.error);
        }, 50);

        // Fetch rank data in the background (non-blocking)
        fetch("/api/riot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameName: data.gameName,
            tagLine: data.tagLine,
            region,
          }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((rankData) => {
            if (rankData?.rankedTier) {
              const updated: TrackedRiotAccount = {
                ...account,
                rankedTier: rankData.rankedTier,
                rankedDivision: rankData.rankedDivision,
                winRate: rankData.winRate,
              };
              setTrackedAccount(updated);
              setTrackedAccountState(updated);
            }
          })
          .catch(() => {});

        return true;
      } catch {
        setIsResolving(false);
        return false;
      }
    },
    [fetchRecentMatches],
  );

  const stopTracking = useCallback(() => {
    clearTrackedAccount(); // Also clears session via storage cascade
    setTrackedAccountState(null);
    setSessionState(null);
    setLatestMatch(null);
  }, []);

  const clearHistory = useCallback(() => {
    clearMatchHistory();
    setMatchHistoryState([]);
    setLatestMatch(null);
  }, []);

  const dismissLatestMatch = useCallback(() => {
    setLatestMatch(null);
  }, []);

  const selectMatch = useCallback((match: MatchResult) => {
    setLatestMatch(match);
  }, []);

  const isTracking =
    !!trackedAccount &&
    !!session &&
    session.state !== "idle" &&
    session.state !== "error";

  return {
    trackedAccount,
    session,
    matchHistory,
    latestMatch,
    isResolving,
    isTracking,
    isFetchingMatches,
    resolveAndTrack,
    stopTracking,
    clearHistory,
    dismissLatestMatch,
    fetchRecentMatches,
    selectMatch,
  };
}
