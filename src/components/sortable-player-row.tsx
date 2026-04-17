"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { QueuePlayer } from "@/types";
import { TIER_LABELS } from "@/types";
import { PROFILE_ICON_URL } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PlayerCard } from "./player-card";
import { PlayerContextMenu } from "./player-context-menu";
import { X, Clock, GripVertical } from "lucide-react";

function getRankColorClass(tier?: string): string {
  const colors: Record<string, string> = {
    IRON: "bg-rank-iron/15 text-rank-iron border-rank-iron/30",
    BRONZE: "bg-rank-bronze/15 text-rank-bronze border-rank-bronze/30",
    SILVER: "bg-rank-silver/15 text-rank-silver border-rank-silver/30",
    GOLD: "bg-rank-gold/15 text-rank-gold border-rank-gold/30",
    PLATINUM: "bg-rank-platinum/15 text-rank-platinum border-rank-platinum/30",
    EMERALD: "bg-rank-emerald/15 text-rank-emerald border-rank-emerald/30",
    DIAMOND: "bg-rank-diamond/15 text-rank-diamond border-rank-diamond/30",
    MASTER: "bg-rank-master/15 text-rank-master border-rank-master/30",
    GRANDMASTER:
      "bg-rank-grandmaster/15 text-rank-grandmaster border-rank-grandmaster/30",
    CHALLENGER:
      "bg-rank-challenger/15 text-rank-challenger border-rank-challenger/30",
  };
  return colors[tier ?? ""] ?? "";
}

interface SortablePlayerRowProps {
  player: QueuePlayer;
  index: number;
  isNew: boolean;
  disableRiotApi: boolean;
  onRemovePlayer: (id: string) => void;
  onUpdatePlayer: (id: string, data: Partial<QueuePlayer>) => void;
  onAddToTeam?: (id: string, team: "A" | "B") => void;
  onRemoveFromTeam?: (id: string) => void;
  isTeamsCreated: boolean;
  onCreateTeamsRequest?: (playerId: string, teamId: "A" | "B") => void;
  onEditPlayer?: (player: QueuePlayer) => void;
  joinTimeFormatted: string;
  joinTimeFull: string;
}

function SortablePlayerRowInner({
  player,
  index,
  isNew,
  disableRiotApi,
  onRemovePlayer,
  onUpdatePlayer,
  onAddToTeam,
  onRemoveFromTeam,
  isTeamsCreated,
  onCreateTeamsRequest,
  onEditPlayer,
  joinTimeFormatted,
  joinTimeFull,
}: SortablePlayerRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { opacity: 0.4, zIndex: 50 } : {}),
  };

  return (
    <PlayerContextMenu
      player={player}
      disableRiotApi={disableRiotApi}
      onUpdatePlayer={onUpdatePlayer}
      onRemovePlayer={onRemovePlayer}
      onAddToTeam={onAddToTeam}
      onRemoveFromTeam={onRemoveFromTeam}
      isTeamsCreated={isTeamsCreated}
      onCreateTeamsRequest={onCreateTeamsRequest}
      onEditPlayer={onEditPlayer}
    >
      <TableRow
        ref={setNodeRef}
        style={style}
        className={`group transition-colors duration-150 border-border/30 cursor-default ${
          isNew ? "animate-in fade-in slide-in-from-bottom-1" : ""
        } ${player.isAway ? "opacity-50 bg-warning/5" : ""} ${
          player.isInGame ? "bg-emerald-500/10 border-emerald-500/50" : ""
        } ${isDragging ? "dragging" : ""}`}
      >
        {/* Drag handle + index */}
        <TableCell className="text-center w-12">
          <div className="flex items-center justify-center gap-1">
            <button
              className="touch-none cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-60 transition-opacity duration-150 focus-visible:opacity-100 shrink-0 p-0.5 rounded hover:bg-muted -ml-1 drag-handle"
              aria-label="Sırayı değiştirmek için sürükle"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <span className="text-xs font-medium text-muted-foreground">
              {index + 1}
            </span>
          </div>
        </TableCell>

        {/* Player */}
        <TableCell>
          <PlayerCard player={player}>
            <button className="flex text-left items-center gap-3 w-full min-w-[200px] outline-none group-focus-visible:ring-2 rounded-sm ring-ring">
              <div className="relative">
                <Avatar className="h-10 w-10 ring-2 ring-border/50 transition-shadow">
                  {player.profileIconId ? (
                    <AvatarImage
                      src={PROFILE_ICON_URL(player.profileIconId)}
                      alt={player.riotGameName}
                    />
                  ) : null}
                  <AvatarFallback className="text-xs font-semibold">
                    {player.riotGameName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {player.summonerLevel && (
                  <div className="absolute -bottom-2 -right-2 bg-background border border-border rounded-full px-1.5 py-px text-[9px] font-bold shadow-sm">
                    {player.summonerLevel}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold tracking-tight truncate max-w-[140px] group-hover:text-primary transition-colors">
                    {player.riotGameName}
                  </p>
                  {player.isAway && (
                    <Badge
                      variant="outline"
                      className="h-4 px-1.5 py-0 text-[9px] border-warning/50 text-warning bg-warning/10 font-semibold tracking-wider shrink-0"
                    >
                      UZAKTA
                    </Badge>
                  )}
                  {player.isInGame && (
                    <Badge
                      variant="outline"
                      className="h-4 px-1.5 py-0 text-[9px] border-emerald-500/50 text-emerald-500 bg-emerald-500/10 font-semibold tracking-wider shrink-0"
                    >
                      OYUNDA
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-[10px] text-muted-foreground">
                    #{player.riotTagLine}
                  </p>
                </div>
              </div>
            </button>
          </PlayerCard>
        </TableCell>

        {/* Kick Username */}
        <TableCell>
          <span className="text-xs text-muted-foreground">
            {player.kickUsername}
          </span>
        </TableCell>

        {/* Rank */}
        <TableCell>
          {player.isLoading ? (
            <Skeleton className="h-5 w-16" />
          ) : player.hasError ? (
            <Tooltip>
              <TooltipTrigger>
                <span className="text-[10px] text-warning cursor-help">
                  Bilinmiyor
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Riot API&apos;den veri alınamadı</p>
              </TooltipContent>
            </Tooltip>
          ) : player.rankedTier ? (
            <Badge
              variant="outline"
              className={`text-[10px] font-medium flex justify-center w-16 ${getRankColorClass(
                player.rankedTier
              )}`}
            >
              {TIER_LABELS[player.rankedTier]}
              {player.rankedTier !== "UNRANKED" &&
                !["MASTER", "GRANDMASTER", "CHALLENGER"].includes(
                  player.rankedTier
                ) &&
                ` ${player.rankedDivision}`}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </TableCell>

        {/* Win Rate */}
        <TableCell className="text-center">
          {player.isLoading ? (
            <Skeleton className="mx-auto h-4 w-10" />
          ) : player.hasError ? (
            <span className="text-[10px] text-warning">—</span>
          ) : player.winRate !== undefined ? (
            <span
              className={`text-xs font-medium ${
                player.winRate >= 50 ? "text-success" : "text-destructive"
              }`}
            >
              %{player.winRate}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </TableCell>

        {/* Join Time */}
        <TableCell className="text-center">
          <Tooltip>
            <TooltipTrigger>
              <span className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {joinTimeFormatted}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Katılma: {joinTimeFull}</p>
            </TooltipContent>
          </Tooltip>
        </TableCell>

        {/* Remove */}
        <TableCell>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-muted-foreground hover:text-destructive"
            onClick={() => onRemovePlayer(player.id)}
            aria-label={`${player.riotGameName} oyuncusunu kaldır`}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </TableCell>
      </TableRow>
    </PlayerContextMenu>
  );
}

// Custom comparator — only re-render when actual player data changes
export const SortablePlayerRow = React.memo(
  SortablePlayerRowInner,
  (prev, next) => {
    if (prev.index !== next.index) return false;
    if (prev.isNew !== next.isNew) return false;
    if (prev.isTeamsCreated !== next.isTeamsCreated) return false;
    if (prev.joinTimeFormatted !== next.joinTimeFormatted) return false;

    const p = prev.player;
    const n = next.player;
    return (
      p.id === n.id &&
      p.riotGameName === n.riotGameName &&
      p.riotTagLine === n.riotTagLine &&
      p.kickUsername === n.kickUsername &&
      p.profileIconId === n.profileIconId &&
      p.summonerLevel === n.summonerLevel &&
      p.rankedTier === n.rankedTier &&
      p.rankedDivision === n.rankedDivision &&
      p.winRate === n.winRate &&
      p.isLoading === n.isLoading &&
      p.hasError === n.hasError &&
      p.isAway === n.isAway &&
      p.isInGame === n.isInGame
    );
  }
);

SortablePlayerRow.displayName = "SortablePlayerRow";
