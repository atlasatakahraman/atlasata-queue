"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle, Lock, Ban } from "lucide-react";

interface ModerationPlayerBadgeProps {
  isWarned: boolean;
  isPunished: boolean;
  isBanned: boolean;
  warningLevel: number;
  respectPoints: number;
}

export function ModerationPlayerBadge({
  isWarned,
  isPunished,
  isBanned,
  warningLevel,
  respectPoints,
}: ModerationPlayerBadgeProps) {
  if (!isWarned && !isPunished && !isBanned) return null;

  return (
    <div className="flex items-center gap-1">
      {isBanned && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="destructive"
              className="h-5 px-1 text-[9px] gap-0.5 animate-badge-pulse"
            >
              <Ban className="h-2.5 w-2.5" />
              Yasaklı
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Bu oyuncu yasaklanmış</p>
          </TooltipContent>
        </Tooltip>
      )}

      {isPunished && !isBanned && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="h-5 px-1 text-[9px] gap-0.5 border-[var(--cl-punishment)] text-[var(--cl-punishment)]"
            >
              <Lock className="h-2.5 w-2.5" />
              Cezalı
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Bu oyuncu cezalı</p>
          </TooltipContent>
        </Tooltip>
      )}

      {isWarned && !isPunished && !isBanned && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="h-5 px-1 text-[9px] gap-0.5 border-[var(--cl-warning)] text-[var(--cl-warning)]"
            >
              <AlertTriangle className="h-2.5 w-2.5" />
              {warningLevel}/2
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{warningLevel}. uyarı seviyesinde</p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Respect score mini indicator */}
      {respectPoints < 70 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`text-[9px] font-mono font-medium px-1 ${
              respectPoints >= 40 ? "text-[var(--cl-warning)]" : "text-[var(--cl-banned)]"
            }`}>
              {respectPoints}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Saygı Puanı: {respectPoints}/100</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
