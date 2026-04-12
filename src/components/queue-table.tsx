"use client";

import type { QueuePlayer } from "@/types";
import { TIER_LABELS } from "@/types";
import { PROFILE_ICON_URL } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PlayerCard } from "./player-card";
import { PlayerContextMenu } from "./player-context-menu";
import { X, Shield, Clock } from "lucide-react";
import { toast } from "sonner";

interface QueueTableProps {
  players: QueuePlayer[];
  onRemovePlayer: (id: string) => void;
  onUpdatePlayer: (id: string, data: Partial<QueuePlayer>) => void;
  queueCommand?: string;
  disableRiotApi?: boolean;
  onAddToTeam?: (id: string, team: "A" | "B") => void;
  onRemoveFromTeam?: (id: string) => void;
  isTeamsCreated?: boolean;
  onCreateTeamsRequest?: (playerId: string, teamId: "A" | "B") => void;
  onManualAddRequest?: () => void;
}

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

export function QueueTable({
  players,
  onRemovePlayer,
  onUpdatePlayer,
  queueCommand = "!sıra",
  disableRiotApi = false,
  onAddToTeam,
  onRemoveFromTeam,
  isTeamsCreated = false,
  onCreateTeamsRequest,
  onManualAddRequest
}: QueueTableProps) {
  if (players.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center h-[calc(100vh-22rem)] min-h-[300px]">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
          <Shield className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-sm font-medium text-muted-foreground">
          Sırada henüz kimse yok
        </h3>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground/70">
          Kick sohbetinde{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">
            {queueCommand}{disableRiotApi ? "" : " İsim#TAG"}
          </code>{" "}
          yazarak veya sağ tıklayarak sıraya katılabilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-22rem)] min-h-[300px]" id="queue-scroll-area">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border/50">
            <TableHead className="w-12 text-center text-xs">#</TableHead>
            <TableHead className="text-xs">Oyuncu</TableHead>
            <TableHead className="text-xs">Kick</TableHead>
            <TableHead className="text-xs">Derece</TableHead>
            <TableHead className="text-xs text-center">Kazanma</TableHead>
            <TableHead className="w-14 text-xs text-center">Saat</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player, index) => (
            <PlayerContextMenu
              key={player.id}
              player={player}
              disableRiotApi={disableRiotApi}
              onUpdatePlayer={onUpdatePlayer}
              onRemovePlayer={onRemovePlayer}
              onAddToTeam={onAddToTeam}
              onRemoveFromTeam={onRemoveFromTeam}
              isTeamsCreated={isTeamsCreated}
              onCreateTeamsRequest={onCreateTeamsRequest}
            >
              <TableRow
                className={`group transition-colors duration-150 border-border/30 animate-in fade-in slide-in-from-bottom-1 cursor-default ${player.isAway ? "opacity-50 bg-warning/5" : ""
                  } ${player.isInGame ? "bg-emerald-500/10 border-emerald-500/50" : ""}`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                      <TableCell className="text-center">
                        <span className="text-xs font-medium text-muted-foreground">
                          {index + 1}
                        </span>
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
                                  <Badge variant="outline" className="h-4 px-1.5 py-0 text-[9px] border-warning/50 text-warning bg-warning/10 font-semibold tracking-wider shrink-0">
                                    UZAKTA
                                  </Badge>
                                )}
                                {player.isInGame && (
                                  <Badge variant="outline" className="h-4 px-1.5 py-0 text-[9px] border-emerald-500/50 text-emerald-500 bg-emerald-500/10 font-semibold tracking-wider shrink-0">
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
                            className={`text-[10px] font-medium flex justify-center w-16 ${getRankColorClass(player.rankedTier)}`}
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
                            className={`text-xs font-medium ${player.winRate >= 50
                              ? "text-success"
                              : "text-destructive"
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
                              {new Date(player.joinedAt).toLocaleTimeString("tr-TR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Katılma:{" "}
                              {new Date(player.joinedAt).toLocaleString("tr-TR")}
                            </p>
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
          ))}
                </TableBody>
              </Table>
            </ScrollArea>
          );
}
