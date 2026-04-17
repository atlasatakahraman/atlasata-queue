"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import type { QueuePlayer, TeamResult } from "@/types";
import { TEAM_NAMES } from "@/lib/constants";
import { logger } from "@/lib/utils";
import { toast } from "sonner";

const STORAGE_KEY = "atlas-queue-session";

interface StoredSession {
  players: QueuePlayer[];
  streamStartedAt: string;
}

export function useQueue(isLive: boolean = false) {
  const [players, setPlayers] = useState<QueuePlayer[]>([]);
  const [teamResult, setTeamResult] = useState<TeamResult | null>(null);

  const hasRestoredRef = useRef(false);
  const playersRef = useRef<QueuePlayer[]>(players);

  // Keep ref in sync for stable callbacks
  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    if (!isLive) {
      hasRestoredRef.current = false;
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const session: StoredSession = JSON.parse(stored);
        if (session.players && session.players.length > 0) {
          const restored = session.players.map((p) => ({
            ...p,
            joinedAt: new Date(p.joinedAt),
            isLoading: false,
          }));
          setPlayers(restored);
          logger.log(
            `[Queue] Restored ${restored.length} players from session`
          );
        }
      }
    } catch { }

    hasRestoredRef.current = true;
  }, [isLive]);

  useEffect(() => {
    if (!isLive) return;
    if (!hasRestoredRef.current) return;

    try {
      if (players.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      const session: StoredSession = {
        players,
        streamStartedAt:
          JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")
            .streamStartedAt ?? new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch { }
  }, [players, isLive]);

  const addPlayer = useCallback((player: QueuePlayer) => {
    setPlayers((prev) => [...prev, player]);
  }, []);

  const removePlayer = useCallback((id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setTeamResult((prevResult) => {
      if (!prevResult) return prevResult;
      const hasPlayer = prevResult.teamA.players.some((p) => p.id === id) || 
                        prevResult.teamB.players.some((p) => p.id === id);
      if (!hasPlayer) return prevResult;

      return {
        ...prevResult,
        teamA: { ...prevResult.teamA, players: prevResult.teamA.players.filter((p) => p.id !== id) },
        teamB: { ...prevResult.teamB, players: prevResult.teamB.players.filter((p) => p.id !== id) }
      };
    });
  }, []);

  const updatePlayer = useCallback(
    (id: string, data: Partial<QueuePlayer>) => {
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;

          const newData = { ...data };
          if (newData.isAway === true) {
            newData.isInGame = false;
          }
          if (newData.isInGame === true) {
            newData.isAway = false;
          }

          return { ...p, ...newData };
        })
      );

      if (data.isAway === true) {
        setTeamResult((prevResult) => {
          if (!prevResult) return prevResult;
          const hasPlayer = prevResult.teamA.players.some(p => p.id === id) || prevResult.teamB.players.some(p => p.id === id);
          if (!hasPlayer) return prevResult;

          return {
            ...prevResult,
            teamA: { ...prevResult.teamA, players: prevResult.teamA.players.filter(p => p.id !== id) },
            teamB: { ...prevResult.teamB, players: prevResult.teamB.players.filter(p => p.id !== id) }
          };
        });
      }
    },
    []
  );

  const clearQueue = useCallback(() => {
    setPlayers([]);
    setTeamResult(null);
  }, []);

  const clearSession = useCallback(() => {
    setPlayers([]);
    setTeamResult(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      logger.log("[Queue] Session cleared from localStorage");
    } catch {
    }
  }, []);

  const isDuplicate = useCallback(
    (gameName: string, tagLine: string) => {
      return playersRef.current.some(
        (p) =>
          p.riotGameName.toLowerCase() === gameName.toLowerCase() &&
          p.riotTagLine.toLowerCase() === tagLine.toLowerCase()
      );
    },
    []
  );

  const reorderPlayers = useCallback(
    (activeId: string, overId: string) => {
      setPlayers((prev) => {
        const oldIndex = prev.findIndex((p) => p.id === activeId);
        const newIndex = prev.findIndex((p) => p.id === overId);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
    },
    []
  );

  const reorderTeam = useCallback(
    (teamId: "A" | "B", activeId: string, overId: string) => {
      setTeamResult((prev) => {
        if (!prev) return prev;
        const team = teamId === "A" ? prev.teamA : prev.teamB;
        const oldIndex = team.players.findIndex((p) => p.id === activeId);
        const newIndex = team.players.findIndex((p) => p.id === overId);
        if (oldIndex === -1 || newIndex === -1) return prev;
        const reordered = arrayMove(team.players, oldIndex, newIndex);
        return {
          ...prev,
          ...(teamId === "A"
            ? { teamA: { ...prev.teamA, players: reordered } }
            : { teamB: { ...prev.teamB, players: reordered } }),
        };
      });
    },
    []
  );

  const randomizeTeams = useCallback(
    (teamSize: number, onlyInGame: boolean = false) => {
      const activePlayers = players.filter(p => !p.isAway && (!onlyInGame || p.isInGame));
      
      const minPlayers = onlyInGame ? 3 : teamSize * 2;
      if (activePlayers.length < minPlayers) return null;

      let teamAPlayers: QueuePlayer[] = [];
      let teamBPlayers: QueuePlayer[] = [];
      
      let prevAIds = new Set<string>();
      let prevBIds = new Set<string>();
      if (onlyInGame && teamResult) {
        prevAIds = new Set(teamResult.teamA.players.map(p => p.id));
        prevBIds = new Set(teamResult.teamB.players.map(p => p.id));
      }

      let attempts = 0;
      const MAX_ATTEMPTS = 50;

      while (attempts < MAX_ATTEMPTS) {
        attempts++;
        const shuffled = [...activePlayers];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        if (onlyInGame) {
          let mid = Math.ceil(shuffled.length / 2);
          if (shuffled.length % 2 !== 0 && Math.random() > 0.5) {
            mid = Math.floor(shuffled.length / 2);
          }
          teamAPlayers = shuffled.slice(0, mid);
          teamBPlayers = shuffled.slice(mid, shuffled.length);

          // Force alliances to break if possible
          if (teamResult) {
            const matchA = teamAPlayers.length === prevAIds.size && teamAPlayers.every(p => prevAIds.has(p.id));
            const matchB = teamAPlayers.length === prevBIds.size && teamAPlayers.every(p => prevBIds.has(p.id));
            if (matchA || matchB) {
              continue; // exact same team splits, try again!
            }
          }
        } else {
          teamAPlayers = shuffled.slice(0, teamSize);
          teamBPlayers = shuffled.slice(teamSize, teamSize * 2);
        }
        
        break; // found a good arrangement!
      }

      const result: TeamResult = {
        teamA: {
          name: TEAM_NAMES.A,
          players: teamAPlayers,
        },
        teamB: {
          name: TEAM_NAMES.B,
          players: teamBPlayers,
        },
        createdAt: new Date(),
      };

      const selectedIds = new Set([
        ...result.teamA.players.map(p => p.id),
        ...result.teamB.players.map(p => p.id)
      ]);

      if (!onlyInGame) {
        setPlayers(prev => prev.map(p => ({
          ...p,
          isInGame: selectedIds.has(p.id)
        })));
      }

      setTeamResult(result);
      return result;
    },
    [players, teamResult]
  );

  const pickRandomPlayer = useCallback((onlyInGame: boolean = false): QueuePlayer | null => {
    const activePlayers = players.filter(p => !p.isAway && (!onlyInGame || p.isInGame));
    if (activePlayers.length === 0) return null;
    const index = Math.floor(Math.random() * activePlayers.length);
    return activePlayers[index];
  }, [players]);

  const createEmptyTeams = useCallback(() => {
    setTeamResult({
      teamA: { name: TEAM_NAMES.A, players: [] },
      teamB: { name: TEAM_NAMES.B, players: [] },
      createdAt: new Date(),
    });
    toast.success("Takımlar Oluşturuldu", {
      description: "Boş takımlar oluşturuldu, manuel atama yapabilirsiniz.",
    });
  }, []);

  const addPlayerToTeam = useCallback((playerId: string, teamId: "A" | "B", teamSize: number) => {
    const targetPlayer = players.find(p => p.id === playerId);
    if (!targetPlayer) return;

    if (targetPlayer.isAway) {
      toast.error("İşlem Başarısız", {
        description: `${targetPlayer.kickUsername} şu anda 'Uzakta' olduğu için takıma eklenemez.`,
      });
      return;
    }

    if (teamResult) {
      const targetTeam = teamId === "A" ? teamResult.teamA : teamResult.teamB;
      const alreadyInTeam = targetTeam.players.some(p => p.id === playerId);
      if (!alreadyInTeam && targetTeam.players.length >= teamSize) {
        toast.error("Takım Dolu", {
          description: `${targetTeam.name} zaten ${teamSize} kişi limitine ulaştı.`
        });
        return;
      }
    }

    setTeamResult((prev) => {
      let currentResult = prev;
      if (!currentResult) {
        currentResult = {
          teamA: { name: TEAM_NAMES.A, players: [] },
          teamB: { name: TEAM_NAMES.B, players: [] },
          createdAt: new Date(),
        };
      }

      const newPlayer = { ...targetPlayer, isInGame: true };
      const filteredA = currentResult.teamA.players.filter(p => p.id !== playerId);
      const filteredB = currentResult.teamB.players.filter(p => p.id !== playerId);

      return {
        ...currentResult,
        teamA: { ...currentResult.teamA, players: teamId === "A" ? [...filteredA, newPlayer] : filteredA },
        teamB: { ...currentResult.teamB, players: teamId === "B" ? [...filteredB, newPlayer] : filteredB }
      };
    });

    setPlayers((prev) => prev.map(p => p.id === playerId ? { ...p, isInGame: true } : p));
    toast.success("Takıma Eklendi", {
      description: `${targetPlayer.kickUsername}, ${teamId === "A" ? "Mavi Takım" : "Kırmızı Takım"}'a katıldı.`,
    });
  }, [players, teamResult]);

  const removePlayerFromTeam = useCallback((playerId: string) => {
    const targetPlayer = players.find(p => p.id === playerId);
    if (targetPlayer) {
      toast.info("Takımdan Çıkarıldı", {
        description: `${targetPlayer.kickUsername} takımdan çıkarılıp sıraya geri gönderildi.`
      });
    }

    setTeamResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        teamA: { ...prev.teamA, players: prev.teamA.players.filter(p => p.id !== playerId) },
        teamB: { ...prev.teamB, players: prev.teamB.players.filter(p => p.id !== playerId) }
      };
    });
    setPlayers((prev) => {
      const idx = prev.findIndex((p) => p.id === playerId);
      if (idx === -1) return prev;
      const player = { ...prev[idx], isInGame: false };
      const without = [...prev.slice(0, idx), ...prev.slice(idx + 1)];
      return [...without, player];
    });
  }, [players]);

  const movePlayerBetweenTeams = useCallback((playerId: string, targetTeamId: "A" | "B", teamSize: number) => {
    const targetPlayer = players.find(p => p.id === playerId);

    if (teamResult) {
      const targetTeam = targetTeamId === "A" ? teamResult.teamA : teamResult.teamB;
      const alreadyInTeam = targetTeam.players.some(p => p.id === playerId);
      if (!alreadyInTeam && targetTeam.players.length >= teamSize) {
        toast.error("Takım Dolu", {
          description: `${targetTeam.name} zaten ${teamSize} kişi limitine ulaştı.`
        });
        return;
      }
    }

    if (targetPlayer) {
      toast.success("Transfer Edildi", {
        description: `${targetPlayer.kickUsername}, ${targetTeamId === "A" ? "Mavi Takım" : "Kırmızı Takım"}'a transfer edildi.`
      });
    }

    setTeamResult((prev) => {
      if (!prev) return prev;
      const playerToMove = prev.teamA.players.find(p => p.id === playerId) || prev.teamB.players.find(p => p.id === playerId);
      if (!playerToMove) return prev;

      const filteredA = prev.teamA.players.filter(p => p.id !== playerId);
      const filteredB = prev.teamB.players.filter(p => p.id !== playerId);

      return {
        ...prev,
        teamA: { ...prev.teamA, players: targetTeamId === "A" ? [...filteredA, playerToMove] : filteredA },
        teamB: { ...prev.teamB, players: targetTeamId === "B" ? [...filteredB, playerToMove] : filteredB }
      };
    });
  }, [players, teamResult]);

  const clearTeams = useCallback(() => {
    setTeamResult(null);
    setPlayers((prev) => prev.map(p => ({ ...p, isInGame: false })));
    toast.info("Takımlar Silindi", {
      description: "Takımlar silindi ve oyuncular sıraya geri döndü.",
    });
  }, []);

  const stats = useMemo(() => {
    const total = players.length;
    const loading = players.filter((p) => p.isLoading).length;
    const withRank = players.filter(
      (p) => p.rankedTier && p.rankedTier !== "UNRANKED"
    ).length;
    return { total, loading, withRank };
  }, [players]);

  return {
    players,
    setPlayers,
    teamResult,
    setTeamResult,
    addPlayer,
    removePlayer,
    updatePlayer,
    clearQueue,
    clearSession,
    isDuplicate,
    reorderPlayers,
    reorderTeam,
    randomizeTeams,
    pickRandomPlayer,
    createEmptyTeams,
    addPlayerToTeam,
    removePlayerFromTeam,
    movePlayerBetweenTeams,
    clearTeams,
    stats,
  };
}
