"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MatchResult, MatchTeamSummary } from "@/lib/riot/types";
import { Trophy, Skull, Clock, X, UserPlus, Shield, Check, Copy } from "lucide-react";
import { getGameTypeName, getGameTypeBadgeStyle } from "@/lib/utils";
import { toast } from "sonner";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useState } from "react";

const ARENA_TEAM_COLORS = [
  "bg-blue-500 text-blue-600 dark:text-blue-400",
  "bg-red-500 text-red-600 dark:text-red-400",
  "bg-amber-500 text-amber-600 dark:text-amber-400",
  "bg-violet-500 text-violet-600 dark:text-violet-400",
  "bg-emerald-500 text-emerald-600 dark:text-emerald-400",
  "bg-pink-500 text-pink-600 dark:text-pink-400",
];

interface MatchResultCardProps {
  match: MatchResult;
  onDismiss?: () => void;
  onAddPlayerToQueue?: (riotGameName: string, riotTagLine: string) => void;
  onModeratePlayer?: (kickUsername: string, actionType: "warning" | "punishment" | "ban") => void;
}

export function MatchResultCard({
  match,
  onDismiss,
  onAddPlayerToQueue,
  onModeratePlayer,
}: MatchResultCardProps) {
  const durationMinutes = Math.floor(match.gameDuration / 60);
  const durationSeconds = match.gameDuration % 60;

  const [copiedPlayerId, setCopiedPlayerId] = useState<string | null>(null);

  const defaultTag = match.matchId && match.matchId.includes("_") 
    ? match.matchId.split("_")[0] 
    : "TR1";

  const handleCopyRiotId = (id: string, gameName?: string, tagLine?: string, fallbackName?: string) => {
    const textToCopy = gameName && tagLine ? `${gameName}#${tagLine}` : (fallbackName || "Bilinmiyor");
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        toast.success(`Riot ID kopyalandı: ${textToCopy}`);
        setCopiedPlayerId(id);
        setTimeout(() => setCopiedPlayerId(null), 1500);
      })
      .catch(() => toast.error("Kopyalama başarısız oldu"));
  };

  // Extract teams
  let trackedTeam = match.teams.find((t) => t.teamId === match.teamId);
  let enemyTeam = match.teams.find((t) => t.teamId !== match.teamId);

  // Robust Fallback: If one team is empty but we have players, or if we have Arena mode with weird team groupings,
  // let's split all players into Winners (Left) and Losers (Right) to guarantee a symmetric two-team display.
  const allPlayers = match.teams.flatMap((t) => t.players);
  const hasEmptyTeam = !trackedTeam || trackedTeam.players.length === 0 || !enemyTeam || enemyTeam.players.length === 0;
  
  if (hasEmptyTeam && allPlayers.length > 0) {
    const winners = allPlayers.filter((p) => p.win === true);
    const losers = allPlayers.filter((p) => p.win === false);
    
    // If all players ended up in one team because p.win is undefined (old cached data),
    // split the players array in half to ensure a visually balanced 2-column layout.
    if (winners.length === 0 || losers.length === 0) {
      const half = Math.ceil(allPlayers.length / 2);
      const team1Players = allPlayers.slice(0, half);
      const team2Players = allPlayers.slice(half);

      trackedTeam = {
        teamId: match.win ? 1 : 2,
        win: match.win,
        players: match.win ? team1Players : team2Players,
      };
      enemyTeam = {
        teamId: match.win ? 2 : 1,
        win: !match.win,
        players: match.win ? team2Players : team1Players,
      };
    } else {
      // Robust Virtual Teams split by actual win status
      trackedTeam = {
        teamId: match.win ? 1 : 2,
        win: match.win,
        players: match.win ? winners : losers,
      };
      enemyTeam = {
        teamId: match.win ? 2 : 1,
        win: !match.win,
        players: match.win ? losers : winners,
      };
    }
  }

  // Map teams to Blue and Red specifically
  const blueTeam = match.teams.find((t) => t.teamId === 100 || t.teamId === 1) || trackedTeam;
  const redTeam = match.teams.find((t) => t.teamId === 200 || t.teamId === 2 || t.teamId !== (blueTeam?.teamId ?? 1)) || enemyTeam;

  const isArena = match.queueId === 1700 || match.gameMode?.toUpperCase() === "CHERRY" || match.gameMode?.toUpperCase() === "ARENA";
  const bluePlayers = (isArena && blueTeam) ? blueTeam.players.slice(0, 3) : (blueTeam?.players || []);
  const redPlayers = (isArena && redTeam) ? redTeam.players.slice(0, 3) : (redTeam?.players || []);

  // Ensure we have exactly 6 teams for Arena mode to complete 18 players
  let displayTeams = match.teams || [];
  if (isArena) {
    const chunkedTeams: MatchTeamSummary[] = [];

    for (let i = 0; i < 6; i++) {
      const startIdx = i * 3;
      const teamPlayers = allPlayers.slice(startIdx, startIdx + 3);

      if (teamPlayers.length > 0) {
        chunkedTeams.push({
          teamId: i + 1,
          win: teamPlayers.some((p) => p.win),
          players: teamPlayers,
        });
      } else {
        chunkedTeams.push({
          teamId: i + 1,
          win: false,
          players: Array.from({ length: 3 }).map((_, pIdx) => ({
            summonerName: `Oyuncu #${(i * 3) + pIdx + 1}`,
            championId: 0,
            championName: "Mock",
            kills: 0,
            deaths: 0,
            assists: 0,
            teamId: i + 1,
            damageDealt: 0,
            win: false,
          })),
        });
      }
    }
    displayTeams = chunkedTeams;
  }

  return (
    <Card
      className={`border-border/50 overflow-hidden relative ${
        match.win
          ? "ring-1 ring-[#3b3628]/30 dark:ring-[#cec6b1]/30"
          : "ring-1 ring-[#625e56]/20 dark:ring-[#cbc6bc]/20"
      }`}
    >
      {/* Win/Loss indicator bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 ${
          match.win
            ? "bg-gradient-to-r from-transparent via-[#3b3628]/60 dark:via-[#cec6b1]/60 to-transparent"
            : "bg-gradient-to-r from-transparent via-[#625e56]/30 dark:via-[#cbc6bc]/30 to-transparent"
        }`}
      />

      <div key={match.matchId} className="animate-fade-in">

      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {match.win ? (
              <Trophy className="h-4 w-4 text-[#3b3628] dark:text-[#cec6b1]" />
            ) : (
              <Skull className="h-4 w-4 text-muted-foreground" />
            )}
            <CardTitle className="text-sm font-medium">
              Maç Sonucu
            </CardTitle>
            <Badge
              variant="outline"
              className={`text-[10px] font-bold uppercase tracking-wider ${
                match.win
                  ? "bg-success/20 text-success border-success/30 hover:bg-success/20"
                  : "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/10"
              }`}
            >
              {match.win ? "Zafer" : "Mağlup"}
            </Badge>
            <Badge
              variant="outline"
              className={`text-[10px] h-5 px-2 border-none font-bold inline-flex items-center justify-center leading-none select-none ${getGameTypeBadgeStyle(match.queueId, match.gameMode)}`}
            >
              {getGameTypeName(match.queueId, match.gameMode)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {durationMinutes}:{durationSeconds.toString().padStart(2, "0")}
              </span>
            </div>
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onDismiss}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-4">
        {/* Player stats highlight */}
        <div 
          className={`mb-3 p-2.5 rounded-md border animate-slide-down-fade ${
            match.win
              ? "bg-[#e6f4ea] text-[#137333] border-[#a8dab5] dark:bg-success/10 dark:text-foreground dark:border-success/20"
              : "bg-[#fce8e6] text-[#c5221f] border-[#f5c2c1] dark:bg-destructive/10 dark:text-foreground dark:border-destructive/20"
          }`}
          style={{ animationDelay: "0ms" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://ddragon.leagueoflegends.com/cdn/15.7.1/img/champion/${match.championName}.png`}
                  alt={match.championName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <div>
                <p className="text-xs font-medium">{match.championName}</p>
                <p className="text-[10px] text-muted-foreground">
                  {getGameTypeName(match.queueId, match.gameMode)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-sm font-bold tabular-nums">
                  {match.kills}/{match.deaths}/{match.assists}
                </p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                  KDA
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium tabular-nums">{match.cs}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                  CS
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium tabular-nums">
                  {(match.goldEarned / 1000).toFixed(1)}k
                </p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                  Altın
                </p>
              </div>
              {match.damageDealt !== undefined && (
                <div className="text-center">
                  <p className="text-sm font-bold text-orange-400 tabular-nums">
                    {(match.damageDealt / 1000).toFixed(1)}k
                  </p>
                  <p className="text-[9px] text-orange-400/80 uppercase tracking-wider">
                    Hasar
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Teams summary */}
        {isArena ? (
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 mt-4 pt-2 border-t border-border/10">
            {displayTeams.map((team, tIdx) => {
              const colorInfo = ARENA_TEAM_COLORS[tIdx % ARENA_TEAM_COLORS.length];
              const [bgClass, textClass] = colorInfo.split(" ");
              const teamPlayers = team.players.slice(0, 3);
              const isLeftColumn = tIdx % 2 === 0;

              return (
                <div 
                  key={tIdx} 
                  className={`space-y-1 ${isLeftColumn ? "animate-slide-right-fade" : "animate-slide-left-fade"}`}
                  style={{ animationDelay: `${Math.floor(tIdx / 2) * 50 + 60}ms` }}
                >
                  <div className="flex items-center gap-1.5 mb-2 pb-1 border-b border-border/30 justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${bgClass}`} />
                      <span className={`text-xs font-bold uppercase tracking-wide truncate ${textClass}`}>
                        Takım #{tIdx + 1}
                      </span>
                    </div>
                    {team.win ? (
                      <Badge className="text-[9px] bg-success/20 text-success border-success/30 hover:bg-success/20 px-1.5 py-0 h-4 font-bold shrink-0">
                        ZAFER
                      </Badge>
                    ) : (
                      <Badge className="text-[9px] bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/10 px-1.5 py-0 h-4 font-bold shrink-0">
                        MAĞLUBİYET
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {teamPlayers.length > 0 ? (
                      teamPlayers.map((p, i) => {
                        const isTrackedPlayer = 
                          p.championId === match.championId &&
                          p.kills === match.kills &&
                          p.deaths === match.deaths &&
                          p.assists === match.assists;

                        const displayName = p.riotIdGameName && p.riotIdTagline 
                          ? `${p.riotIdGameName}#${p.riotIdTagline}` 
                          : `${p.riotIdGameName || p.summonerName}#${defaultTag}`;
                        const [gameName, tagLine] = displayName.split("#");
                        const rowUniqueId = `arena-${tIdx}-${i}`;

                        return (
                          <ContextMenu key={rowUniqueId}>
                            <ContextMenuTrigger asChild>
                              <div
                                className="flex justify-between items-center text-xs py-1.5 px-2 border-b border-border/5 last:border-b-0 gap-2 group hover:bg-muted/30 transition-colors cursor-context-menu"
                              >
                                <div className="flex items-center gap-1 min-w-0 flex-1">
                                  <span 
                                    className={`truncate font-medium cursor-pointer hover:text-primary transition-all select-none ${
                                      isTrackedPlayer
                                        ? "text-foreground font-bold underline decoration-primary/40 underline-offset-2"
                                        : "text-foreground/75"
                                    }`}
                                    title="Riot ID kopyalamak için tıklayın"
                                    onClick={() => handleCopyRiotId(rowUniqueId, gameName, tagLine, p.summonerName)}
                                  >
                                    {gameName}
                                    <span className="text-[10px] text-muted-foreground font-semibold ml-0.5">
                                      #{tagLine}
                                    </span>
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyRiotId(rowUniqueId, gameName, tagLine, p.summonerName);
                                    }}
                                    className="p-0.5 rounded hover:bg-muted-foreground/10 shrink-0 text-muted-foreground/50 hover:text-foreground transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    title="Riot ID kopyala"
                                  >
                                    {copiedPlayerId === rowUniqueId ? (
                                      <Check className="h-3 w-3 text-success shrink-0" />
                                    ) : (
                                      <Copy className="h-2.5 w-2.5 shrink-0" />
                                    )}
                                  </button>
                                </div>
                                <div className="flex gap-4 shrink-0 text-right">
                                  <div className="flex flex-col items-end">
                                    <span className="text-[8px] text-muted-foreground/50 uppercase font-bold tracking-wider leading-none mb-0.5">KDA</span>
                                    <span className="text-muted-foreground tabular-nums text-[11px] leading-tight font-medium">
                                      {p.kills}/{p.deaths}/{p.assists}
                                    </span>
                                  </div>
                                  {p.damageDealt !== undefined && (
                                    <div className="flex flex-col items-end min-w-[36px]">
                                      <span className="text-[8px] text-muted-foreground/50 uppercase font-bold tracking-wider leading-none mb-0.5">Hasar</span>
                                      <span className="text-orange-400 font-semibold tabular-nums text-[11px] leading-tight">
                                        {(p.damageDealt / 1000).toFixed(1)}k
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </ContextMenuTrigger>
                            <ContextMenuContent className="w-52">
                              <ContextMenuLabel className="text-xs truncate">
                                {gameName}#{tagLine}
                              </ContextMenuLabel>
                              <ContextMenuItem
                                className="cursor-pointer"
                                onClick={() => handleCopyRiotId(rowUniqueId, gameName, tagLine, p.summonerName)}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Riot ID Kopyala
                              </ContextMenuItem>
                              {onAddPlayerToQueue && (
                                <ContextMenuItem
                                  className="cursor-pointer"
                                  onClick={() => onAddPlayerToQueue(gameName, tagLine)}
                                >
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  Sıraya Ekle
                                </ContextMenuItem>
                              )}
                              {onModeratePlayer && (
                                <ContextMenuItem
                                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                  onClick={() => onModeratePlayer(gameName, "ban")}
                                >
                                  <Shield className="mr-2 h-4 w-4" />
                                  Yasakla (Ban)
                                </ContextMenuItem>
                              )}
                            </ContextMenuContent>
                          </ContextMenu>
                        );
                      })
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Oyuncu bulunamadı</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 mt-2">
            {/* Blue Team (Left) */}
            <div 
              className="space-y-1 animate-slide-right-fade"
              style={{ animationDelay: "60ms" }}
            >
              <div className="flex items-center gap-1.5 mb-2 pb-1 border-b border-border/30 justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                    Mavi Takım
                  </span>
                </div>
                {blueTeam?.win ? (
                  <Badge className="text-[9px] bg-success/20 text-success border-success/30 hover:bg-success/20 px-1.5 py-0 h-4 font-bold">
                    ZAFER
                  </Badge>
                ) : (
                  <Badge className="text-[9px] bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/10 px-1.5 py-0 h-4 font-bold">
                    MAĞLUBİYET
                  </Badge>
                )}
              </div>
              <div className="space-y-1.5">
                {bluePlayers.length > 0 ? (
                  bluePlayers.map((p, i) => {
                    const isTrackedPlayer = 
                      p.championId === match.championId &&
                      p.kills === match.kills &&
                      p.deaths === match.deaths &&
                      p.assists === match.assists;

                    const displayName = p.riotIdGameName && p.riotIdTagline 
                      ? `${p.riotIdGameName}#${p.riotIdTagline}` 
                      : `${p.riotIdGameName || p.summonerName}#${defaultTag}`;
                    const [gameName, tagLine] = displayName.split("#");
                    const rowUniqueId = `blue-${i}`;

                    return (
                      <ContextMenu key={rowUniqueId}>
                        <ContextMenuTrigger asChild>
                          <div
                            className="flex justify-between items-center text-xs py-1.5 px-2 border-b border-border/5 last:border-b-0 gap-2 group hover:bg-muted/30 transition-colors cursor-context-menu"
                          >
                            <div className="flex items-center gap-1 min-w-0 flex-1">
                              <span 
                                className={`truncate font-medium cursor-pointer hover:text-primary transition-all select-none ${
                                  isTrackedPlayer
                                    ? "text-foreground font-bold underline decoration-primary/40 underline-offset-2"
                                    : "text-foreground/75"
                                }`}
                                title="Riot ID kopyalamak için tıklayın"
                                onClick={() => handleCopyRiotId(rowUniqueId, gameName, tagLine, p.summonerName)}
                              >
                                {gameName}
                                <span className="text-[10px] text-muted-foreground font-semibold ml-0.5">
                                  #{tagLine}
                                </span>
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyRiotId(rowUniqueId, gameName, tagLine, p.summonerName);
                                }}
                                className="p-0.5 rounded hover:bg-muted-foreground/10 shrink-0 text-muted-foreground/50 hover:text-foreground transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Riot ID kopyala"
                              >
                                {copiedPlayerId === rowUniqueId ? (
                                  <Check className="h-3 w-3 text-success shrink-0" />
                                ) : (
                                  <Copy className="h-2.5 w-2.5 shrink-0" />
                                )}
                              </button>
                            </div>
                            <div className="flex gap-4 shrink-0 text-right">
                              <div className="flex flex-col items-end">
                                <span className="text-[8px] text-muted-foreground/50 uppercase font-bold tracking-wider leading-none mb-0.5">KDA</span>
                                <span className="text-muted-foreground tabular-nums text-[11px] leading-tight font-medium">
                                  {p.kills}/{p.deaths}/{p.assists}
                                </span>
                              </div>
                              {p.damageDealt !== undefined && (
                                <div className="flex flex-col items-end min-w-[36px]">
                                  <span className="text-[8px] text-muted-foreground/50 uppercase font-bold tracking-wider leading-none mb-0.5">Hasar</span>
                                  <span className="text-orange-400 font-semibold tabular-nums text-[11px] leading-tight">
                                    {(p.damageDealt / 1000).toFixed(1)}k
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-52">
                          <ContextMenuLabel className="text-xs truncate">
                            {gameName}#{tagLine}
                          </ContextMenuLabel>
                          <ContextMenuItem
                            className="cursor-pointer"
                            onClick={() => handleCopyRiotId(rowUniqueId, gameName, tagLine, p.summonerName)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Riot ID Kopyala
                          </ContextMenuItem>
                          {onAddPlayerToQueue && (
                            <ContextMenuItem
                              className="cursor-pointer"
                              onClick={() => onAddPlayerToQueue(gameName, tagLine)}
                            >
                              <UserPlus className="mr-2 h-4 w-4" />
                              Sıraya Ekle
                            </ContextMenuItem>
                          )}
                          {onModeratePlayer && (
                            <ContextMenuItem
                              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() => onModeratePlayer(gameName, "ban")}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Yasakla (Ban)
                            </ContextMenuItem>
                          )}
                        </ContextMenuContent>
                      </ContextMenu>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground italic">Oyuncu bulunamadı</p>
                )}
              </div>
            </div>

            {/* Red Team (Right) */}
            <div 
              className="space-y-1 animate-slide-left-fade"
              style={{ animationDelay: "60ms" }}
            >
              <div className="flex items-center gap-1.5 mb-2 pb-1 border-b border-border/30 justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                    Kırmızı Takım
                  </span>
                </div>
                {redTeam?.win ? (
                  <Badge className="text-[9px] bg-success/20 text-success border-success/30 hover:bg-success/20 px-1.5 py-0 h-4 font-bold">
                    ZAFER
                  </Badge>
                ) : (
                  <Badge className="text-[9px] bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/10 px-1.5 py-0 h-4 font-bold">
                    MAĞLUBİYET
                  </Badge>
                )}
              </div>
              <div className="space-y-1.5">
                {redPlayers.length > 0 ? (
                  redPlayers.map((p, i) => {
                    const isTrackedPlayer = 
                      p.championId === match.championId &&
                      p.kills === match.kills &&
                      p.deaths === match.deaths &&
                      p.assists === match.assists;

                    const displayName = p.riotIdGameName && p.riotIdTagline 
                      ? `${p.riotIdGameName}#${p.riotIdTagline}` 
                      : `${p.riotIdGameName || p.summonerName}#${defaultTag}`;
                    const [gameName, tagLine] = displayName.split("#");
                    const rowUniqueId = `red-${i}`;

                    return (
                      <ContextMenu key={rowUniqueId}>
                        <ContextMenuTrigger asChild>
                          <div
                            className="flex justify-between items-center text-xs py-1.5 px-2 border-b border-border/5 last:border-b-0 gap-2 group hover:bg-muted/30 transition-colors cursor-context-menu"
                          >
                            <div className="flex items-center gap-1 min-w-0 flex-1">
                              <span 
                                className={`truncate font-medium cursor-pointer hover:text-primary transition-all select-none ${
                                  isTrackedPlayer
                                    ? "text-foreground font-bold underline decoration-primary/40 underline-offset-2"
                                    : "text-foreground/75"
                                }`}
                                title="Riot ID kopyalamak için tıklayın"
                                onClick={() => handleCopyRiotId(rowUniqueId, gameName, tagLine, p.summonerName)}
                              >
                                {gameName}
                                <span className="text-[10px] text-muted-foreground font-semibold ml-0.5">
                                  #{tagLine}
                                </span>
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyRiotId(rowUniqueId, gameName, tagLine, p.summonerName);
                                }}
                                className="p-0.5 rounded hover:bg-muted-foreground/10 shrink-0 text-muted-foreground/50 hover:text-foreground transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Riot ID kopyala"
                              >
                                {copiedPlayerId === rowUniqueId ? (
                                  <Check className="h-3 w-3 text-success shrink-0" />
                                ) : (
                                  <Copy className="h-2.5 w-2.5 shrink-0" />
                                )}
                              </button>
                            </div>
                            <div className="flex gap-4 shrink-0 text-right">
                              <div className="flex flex-col items-end">
                                <span className="text-[8px] text-muted-foreground/50 uppercase font-bold tracking-wider leading-none mb-0.5">KDA</span>
                                <span className="text-muted-foreground tabular-nums text-[11px] leading-tight font-medium">
                                  {p.kills}/{p.deaths}/{p.assists}
                                </span>
                              </div>
                              {p.damageDealt !== undefined && (
                                <div className="flex flex-col items-end min-w-[36px]">
                                  <span className="text-[8px] text-muted-foreground/50 uppercase font-bold tracking-wider leading-none mb-0.5">Hasar</span>
                                  <span className="text-orange-400 font-semibold tabular-nums text-[11px] leading-tight">
                                    {(p.damageDealt / 1000).toFixed(1)}k
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-52">
                          <ContextMenuLabel className="text-xs truncate">
                            {gameName}#{tagLine}
                          </ContextMenuLabel>
                          <ContextMenuItem
                            className="cursor-pointer"
                            onClick={() => handleCopyRiotId(rowUniqueId, gameName, tagLine, p.summonerName)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Riot ID Kopyala
                          </ContextMenuItem>
                          {onAddPlayerToQueue && (
                            <ContextMenuItem
                              className="cursor-pointer"
                              onClick={() => onAddPlayerToQueue(gameName, tagLine)}
                            >
                              <UserPlus className="mr-2 h-4 w-4" />
                              Sıraya Ekle
                            </ContextMenuItem>
                          )}
                          {onModeratePlayer && (
                            <ContextMenuItem
                              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() => onModeratePlayer(gameName, "ban")}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Yasakla (Ban)
                            </ContextMenuItem>
                          )}
                        </ContextMenuContent>
                      </ContextMenu>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground italic">Oyuncu bulunamadı</p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      </div>
    </Card>
  );
}
