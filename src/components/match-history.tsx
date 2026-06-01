"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MatchResult } from "@/lib/riot/types";
import { History, Trophy, Skull, Clock, Trash2 } from "lucide-react";
import { MatchResultCard } from "./match-result";
import { getGameTypeName, getGameTypeBadgeStyle } from "@/lib/utils";

interface MatchHistoryProps {
  matches: MatchResult[];
  onClear?: () => void;
  onSelectMatch?: (match: MatchResult) => void;
}

export function MatchHistory({
  matches,
  onClear,
  onSelectMatch,
}: MatchHistoryProps) {
  if (matches.length === 0) {
    return (
      <Card className="border-dashed border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <History className="h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            Henüz maç geçmişi yok
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Takip edilen oyuncunun maçları burada görünecek
          </p>
        </CardContent>
      </Card>
    );
  }

  const wins = matches.filter((m) => m.win).length;
  const losses = matches.length - wins;
  const winRate =
    matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <History className="h-3.5 w-3.5" />
              Maç Geçmişi
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {matches.length} maç · {wins}G {losses}M · %{winRate} kazanma
            </CardDescription>
          </div>
          {onClear && matches.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
              onClick={onClear}
            >
              <Trash2 className="h-3 w-3" />
              Temizle
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        <div className="space-y-1.5">
          {matches.map((match) => (
            <MatchHistoryRow
              key={match.matchId}
              match={match}
              onClick={() => onSelectMatch?.(match)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface MatchHistoryRowProps {
  match: MatchResult;
  onClick: () => void;
}

function MatchHistoryRow({ match, onClick }: MatchHistoryRowProps) {
  const durationMin = Math.floor(match.gameDuration / 60);
  const durationSec = match.gameDuration % 60;
  const kda =
    match.deaths === 0
      ? "Perfect"
      : ((match.kills + match.assists) / match.deaths).toFixed(1);

  const date = new Date(match.gameStartTimestamp);
  const timeStr = date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const rowStyles = match.win
    ? "bg-[#e6f4ea] text-[#137333] hover:bg-[#daf0e0] border border-[#a8dab5] dark:bg-success/10 dark:text-foreground dark:hover:bg-success/15 dark:border-success/20"
    : "bg-[#fce8e6] text-[#c5221f] hover:bg-[#fadad8] border border-[#f5c2c1] dark:bg-destructive/10 dark:text-foreground dark:hover:bg-destructive/15 dark:border-destructive/20";

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 p-2 rounded-md transition-colors cursor-pointer animate-fade-in ${rowStyles}`}
    >
      {/* Champion icon */}
      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border/10">
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

      {/* Win / loss icon */}
      <div className="shrink-0">
        {match.win ? (
          <Trophy className="h-3.5 w-3.5 text-warning" />
        ) : (
          <Skull className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold truncate">
            {match.championName}
          </span>
          <Badge
            variant="outline"
            className={`text-[9px] h-4 px-1.5 border-none font-bold flex items-center justify-center leading-none select-none ${getGameTypeBadgeStyle(match.queueId, match.gameMode)}`}
          >
            {getGameTypeName(match.queueId, match.gameMode)}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
          <span className="tabular-nums font-bold">
            {match.kills}/{match.deaths}/{match.assists}
          </span>
          <span className="opacity-50">·</span>
          <span className="tabular-nums font-medium">{kda} KDA</span>
          <span className="opacity-50">·</span>
          <span className="tabular-nums font-medium">{match.cs} CS</span>
          {(match.damageDealt !== undefined || match.damageTaken !== undefined || (match.healingDone !== undefined && match.healingDone > 0)) && (
            <>
              <span className="opacity-50">·</span>
              <span className="tabular-nums font-medium text-muted-foreground flex items-center gap-0.5">
                {match.damageDealt !== undefined && (
                  <span className="font-bold text-orange-400/90">
                    {(match.damageDealt / 1000).toFixed(1)}k
                  </span>
                )}
                {match.healingDone !== undefined && match.healingDone > 0 && (
                  <>
                    <span className="text-[9px] opacity-40 font-normal">/</span>
                    <span className="font-bold text-emerald-500/90">
                      {(match.healingDone / 1000).toFixed(1)}k
                    </span>
                  </>
                )}
                {match.damageTaken !== undefined && (
                  <>
                    <span className="text-[9px] opacity-40 font-normal">/</span>
                    <span className="font-bold text-red-500/90">
                      {(match.damageTaken / 1000).toFixed(1)}k
                    </span>
                  </>
                )}
                <span className="ml-1 text-[9px] uppercase font-bold tracking-wider text-muted-foreground/70">Hasar</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Time info */}
      <div className="text-right shrink-0">
        <div className="flex items-center gap-1 text-[10px] justify-end font-medium text-muted-foreground">
          <Clock className="h-2.5 w-2.5 shrink-0" />
          <span className="tabular-nums">
            {durationMin}:{durationSec.toString().padStart(2, "0")}
          </span>
        </div>
        <p className="text-[9px] opacity-70 mt-0.5 tabular-nums text-muted-foreground">
          {timeStr}
        </p>
      </div>
    </div>
  );
}
