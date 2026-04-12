"use client";

import type { TeamResult } from "@/types";
import { TIER_LABELS } from "@/types";
import { PROFILE_ICON_URL } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Swords, Crown } from "lucide-react";
import { PlayerCard } from "./player-card";
import { PlayerContextMenu } from "./player-context-menu";
import type { QueuePlayer } from "@/types";

interface TeamDisplayProps {
  result: TeamResult;
  movePlayerBetweenTeams?: (playerId: string, targetTeamId: "A" | "B") => void;
  removePlayerFromTeam?: (playerId: string) => void;
  onUpdatePlayer: (id: string, data: Partial<QueuePlayer>) => void;
  onRemovePlayer: (id: string) => void;
  disableRiotApi?: boolean;
}

export function TeamDisplay({ 
  result, 
  movePlayerBetweenTeams, 
  removePlayerFromTeam,
  onUpdatePlayer,
  onRemovePlayer,
  disableRiotApi = false,
}: TeamDisplayProps) {
  const handleDragStart = (e: React.DragEvent, playerId: string) => {
    e.dataTransfer.setData("playerId", playerId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = (e: React.DragEvent, playerId: string) => {
    if (e.dataTransfer.dropEffect === "none") {
      if (removePlayerFromTeam) removePlayerFromTeam(playerId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, teamId: "A" | "B") => {
    e.preventDefault();
    const playerId = e.dataTransfer.getData("playerId");
    if (playerId && movePlayerBetweenTeams) {
      movePlayerBetweenTeams(playerId, teamId);
    }
  };
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card 
        className="overflow-hidden border-team-blue/30 bg-team-blue/3 h-full"
        onDragOver={handleDragOver} 
        onDrop={(e) => handleDrop(e, "A")}
      >
        <CardHeader className="pb-3 pointer-events-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-team-blue/15">
                <Swords className="h-4 w-4 text-team-blue" />
              </div>
              <div>
                <CardTitle className="text-sm text-team-blue">
                  {result.teamA.name}
                </CardTitle>
                <CardDescription className="text-[11px]">
                  {result.teamA.players.length} oyuncu
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className="border-team-blue/30 text-team-blue text-[10px]"
            >
              Mavi
            </Badge>
          </div>
        </CardHeader>
        <Separator className="bg-team-blue/10" />
        <CardContent className="pt-3 min-h-[100px]">
          <ScrollArea className="max-h-64">
            <div className="space-y-2">
              {result.teamA.players.map((player, i) => (
                <PlayerCard key={player.id} player={player}>
                  <PlayerContextMenu
                    player={player}
                    disableRiotApi={disableRiotApi}
                    onUpdatePlayer={onUpdatePlayer}
                    onRemovePlayer={onRemovePlayer}
                    onRemoveFromTeam={removePlayerFromTeam}
                    onAddToTeam={(id) => movePlayerBetweenTeams?.(id, "B")}
                    isTeamsCreated={true}
                  >
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, player.id)}
                      onDragEnd={(e) => handleDragEnd(e, player.id)}
                      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-team-blue/10 animate-in fade-in slide-in-from-left-2 duration-300 cursor-grab active:cursor-grabbing outline-none focus-visible:ring-2 ring-ring"
                      style={{ animationDelay: `${i * 80}ms` }}
                    >
                      <span className="w-5 text-center text-xs font-medium text-muted-foreground">
                        {i + 1}
                      </span>
                      <Avatar className="h-8 w-8 ring-1 ring-team-blue/20">
                        {player.profileIconId ? (
                          <AvatarImage
                            src={PROFILE_ICON_URL(player.profileIconId)}
                            alt={player.riotGameName}
                          />
                        ) : null}
                        <AvatarFallback className="text-[10px]">
                          {player.riotGameName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {player.riotGameName}
                          <span className="text-[10px] text-muted-foreground ml-1">
                            #{player.riotTagLine}
                          </span>
                        </p>
                      </div>
                      {player.rankedTier && player.rankedTier !== "UNRANKED" && (
                        <Badge variant="secondary" className="text-[9px] shrink-0">
                          {TIER_LABELS[player.rankedTier]}
                        </Badge>
                      )}
                    </div>
                  </PlayerContextMenu>
                </PlayerCard>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* VS Divider (mobile) */}
      <div className="flex items-center justify-center md:hidden -my-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted ring-2 ring-border">
          <Crown className="h-4 w-4 text-warning" />
        </div>
      </div>

      {/* Team B — Red */}
      <Card 
        className="overflow-hidden border-team-red/30 bg-team-red/3 h-full"
        onDragOver={handleDragOver} 
        onDrop={(e) => handleDrop(e, "B")}
      >
        <CardHeader className="pb-3 pointer-events-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-team-red/15">
                <Swords className="h-4 w-4 text-team-red" />
              </div>
              <div>
                <CardTitle className="text-sm text-team-red">
                  {result.teamB.name}
                </CardTitle>
                <CardDescription className="text-[11px]">
                  {result.teamB.players.length} oyuncu
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className="border-team-red/30 text-team-red text-[10px]"
            >
              Kırmızı
            </Badge>
          </div>
        </CardHeader>
        <Separator className="bg-team-red/10" />
        <CardContent className="pt-3 min-h-[100px]">
          <ScrollArea className="max-h-64">
            <div className="space-y-2">
              {result.teamB.players.map((player, i) => (
                <PlayerCard key={player.id} player={player}>
                  <PlayerContextMenu
                    player={player}
                    disableRiotApi={disableRiotApi}
                    onUpdatePlayer={onUpdatePlayer}
                    onRemovePlayer={onRemovePlayer}
                    onRemoveFromTeam={removePlayerFromTeam}
                    onAddToTeam={(id) => movePlayerBetweenTeams?.(id, "A")}
                    isTeamsCreated={true}
                  >
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, player.id)}
                      onDragEnd={(e) => handleDragEnd(e, player.id)}
                      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-team-red/10 animate-in fade-in slide-in-from-right-2 duration-300 cursor-grab active:cursor-grabbing outline-none focus-visible:ring-2 ring-ring"
                      style={{ animationDelay: `${i * 80}ms` }}
                    >
                      <span className="w-5 text-center text-xs font-medium text-muted-foreground">
                        {i + 1}
                      </span>
                      <Avatar className="h-8 w-8 ring-1 ring-team-red/20">
                        {player.profileIconId ? (
                          <AvatarImage
                            src={PROFILE_ICON_URL(player.profileIconId)}
                            alt={player.riotGameName}
                          />
                        ) : null}
                        <AvatarFallback className="text-[10px]">
                          {player.riotGameName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {player.riotGameName}
                          <span className="text-[10px] text-muted-foreground ml-1">
                            #{player.riotTagLine}
                          </span>
                        </p>
                      </div>
                      {player.rankedTier && player.rankedTier !== "UNRANKED" && (
                        <Badge variant="secondary" className="text-[9px] shrink-0">
                          {TIER_LABELS[player.rankedTier]}
                        </Badge>
                      )}
                    </div>
                  </PlayerContextMenu>
                </PlayerCard>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
