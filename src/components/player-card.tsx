"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PROFILE_ICON_URL } from "@/lib/constants";
import type { QueuePlayer } from "@/types";
import { TIER_LABELS } from "@/types";
import {
  Check,
  Copy,
  Gamepad2,
  Shield,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { ContextMenuOpenContext } from "./player-context-menu";

interface PlayerCardProps {
  player: QueuePlayer;
  children: React.ReactNode;
  disabled?: boolean;
}

function getRankColor(tier?: string): string {
  const colors: Record<string, string> = {
    IRON: "text-rank-iron",
    BRONZE: "text-rank-bronze",
    SILVER: "text-rank-silver",
    GOLD: "text-rank-gold",
    PLATINUM: "text-rank-platinum",
    EMERALD: "text-rank-emerald",
    DIAMOND: "text-rank-diamond",
    MASTER: "text-rank-master",
    GRANDMASTER: "text-rank-grandmaster",
    CHALLENGER: "text-rank-challenger",
  };
  return colors[tier ?? ""] ?? "text-muted-foreground";
}

function getRankBadgeVariant(
  tier?: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (!tier || tier === "UNRANKED") return "outline";
  if (["MASTER", "GRANDMASTER", "CHALLENGER"].includes(tier)) return "default";
  return "secondary";
}

export function PlayerCard({ player, children, disabled = false }: PlayerCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const isContextMenuOpen = useContext(ContextMenuOpenContext);
  const [hoverCardOpen, setHoverCardOpen] = useState(false);

  const winRate = player.winRate ?? 0;
  const isWinRateGood = winRate >= 50;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  useEffect(() => {
    if (isContextMenuOpen) {
      setHoverCardOpen(false);
    }
  }, [isContextMenuOpen]);

  const handleOpenChange = (open: boolean) => {
    if (open && isContextMenuOpen) {
      setHoverCardOpen(false);
    } else {
      setHoverCardOpen(open);
    }
  };

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <HoverCard
      openDelay={500}
      closeDelay={100}
      open={hoverCardOpen}
      onOpenChange={handleOpenChange}
    >
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        className="w-72 p-0 overflow-hidden"
        side="bottom"
        align="start"
      >
        {player.isLoading ? (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ) : (
          <>
            {/* Header — Player Identity */}
            <div className="p-4 pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 ring-2 ring-border">
                  {player.profileIconId ? (
                    <AvatarImage
                      src={PROFILE_ICON_URL(player.profileIconId)}
                      alt={player.riotGameName}
                    />
                  ) : null}
                  <AvatarFallback className="text-xs font-medium">
                    {(player.riotGameName || player.kickUsername || "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <button
                    className="flex items-center gap-1 text-sm font-semibold truncate hover:text-primary transition-colors group/copy"
                    onClick={() =>
                      copyToClipboard(
                        `${player.riotGameName}#${player.riotTagLine}`,
                        "riot",
                      )
                    }
                    title="Riot ID'yi kopyala"
                  >
                    <span className="truncate max-w-[130px]">
                      {player.riotGameName}
                    </span>
                    <span className="group-hover/copy:text-primary text-muted-foreground">
                      #{player.riotTagLine}
                    </span>
                    {copiedField === "riot" ? (
                      <Check className="h-3 w-3 text-success shrink-0" />
                    ) : (
                      <Copy className="h-3 w-3 opacity-0 group-hover/copy:opacity-50 shrink-0 transition-opacity" />
                    )}
                  </button>
                </div>
                {player.summonerLevel && (
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    Sv. {player.summonerLevel}
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Rank Section */}
            <div className="p-4 pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield
                    className={`h-4 w-4 ${getRankColor(player.rankedTier)}`}
                  />
                  <span
                    className={`text-sm font-semibold ${getRankColor(player.rankedTier)}`}
                  >
                    {TIER_LABELS[player.rankedTier ?? "UNRANKED"]}
                    {player.rankedTier &&
                      player.rankedTier !== "UNRANKED" &&
                      !["MASTER", "GRANDMASTER", "CHALLENGER"].includes(
                        player.rankedTier,
                      ) &&
                      ` ${player.rankedDivision}`}
                  </span>
                </div>
                {player.leaguePoints !== undefined &&
                  player.rankedTier !== "UNRANKED" && (
                    <span className="text-xs text-muted-foreground">
                      {player.leaguePoints} LP
                    </span>
                  )}
              </div>

              {/* Win/Loss Stats */}
              {player.wins !== undefined && player.losses !== undefined && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-success">
                        <TrendingUp className="h-3 w-3" />
                        {player.wins}G
                      </span>
                      <span className="flex items-center gap-1 text-destructive">
                        <TrendingDown className="h-3 w-3" />
                        {player.losses}M
                      </span>
                    </div>
                    <span
                      className={`font-semibold ${isWinRateGood ? "text-success" : "text-destructive"}`}
                    >
                      %{winRate}
                    </span>
                  </div>
                  <Progress value={winRate} className="h-1.5" />
                </div>
              )}

              <Separator />

              {/* Footer */}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <button
                  className="flex items-center gap-1 hover:text-primary transition-colors group/kickcopy"
                  onClick={() => copyToClipboard(player.kickUsername, "kick")}
                  title="Kick adını kopyala"
                >
                  <Gamepad2 className="h-3 w-3" />
                  <span>Kick: {player.kickUsername}</span>
                  {copiedField === "kick" ? (
                    <Check className="h-3 w-3 text-success" />
                  ) : (
                    <Copy className="h-3 w-3 opacity-0 group-hover/kickcopy:opacity-50 transition-opacity" />
                  )}
                </button>
                <span>
                  {new Date(player.joinedAt).toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
