"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getRespectTier } from "@/lib/moderation-constants";
import { AlertTriangle, Ban, Lock } from "lucide-react";

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
  // Always display respect score, do not return null here

  const tier = getRespectTier(respectPoints);

  return (
    <div
      className="flex items-center gap-1.5 select-none"
      onMouseEnter={(e) => e.stopPropagation()}
      onMouseLeave={(e) => e.stopPropagation()}
      onMouseOver={(e) => e.stopPropagation()}
    >
      {isBanned && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              className="h-5 px-1.5 text-[9px] font-bold uppercase tracking-wider gap-0.5 animate-badge-pulse bg-cl-banned hover:bg-cl-banned/90 text-white border-none shadow-sm"
            >
              <Ban className="h-2.5 w-2.5" />
              Yasaklı
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="glass max-w-[200px] text-xs text-foreground">
            <p className="font-semibold text-cl-banned">Yasaklı Oyuncu</p>
            <p className="text-muted-foreground mt-0.5">Bu oyuncu sıradan kalıcı veya süreli olarak yasaklanmıştır.</p>
          </TooltipContent>
        </Tooltip>
      )}

      {isPunished && !isBanned && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="h-5 px-1.5 text-[9px] font-bold uppercase tracking-wider gap-0.5 border-cl-punishment text-cl-punishment bg-cl-punishment/10 hover:bg-cl-punishment/15"
            >
              <Lock className="h-2.5 w-2.5" />
              Cezalı
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="glass max-w-[200px] text-xs text-foreground">
            <p className="font-semibold text-cl-punishment">Cezalı Oyuncu</p>
            <p className="text-muted-foreground mt-0.5">Bu oyuncunun aktif maçı veya süreli cezası devam etmektedir.</p>
          </TooltipContent>
        </Tooltip>
      )}

      {isWarned && !isPunished && !isBanned && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="h-5 px-1.5 text-[9px] font-bold uppercase tracking-wider gap-0.5 border-cl-warning text-cl-warning bg-cl-warning/10 hover:bg-cl-warning/15"
            >
              <AlertTriangle className="h-2.5 w-2.5" />
              {warningLevel}/2 Uyarı
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="glass max-w-[200px] text-xs text-foreground">
            <p className="font-semibold text-cl-warning">{warningLevel}. Uyarı Seviyesi</p>
            <p className="text-muted-foreground mt-0.5">Oyuncunun 2. uyarı sınırına ulaşmasına az kaldı. 2. uyarıda otomatik ceza uygulanır.</p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Respect score mini indicator - show when less than perfect (90) */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`h-5 px-1.5 text-[10px] font-mono font-bold cursor-pointer transition-colors border-border/20 shadow-xs bg-muted/65 hover:bg-muted/80 rounded-full ${tier.color}`}
          >
            {respectPoints}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="glass p-2 max-w-[200px] text-xs text-foreground">
          <div className="space-y-1">
            <div className="flex items-center justify-between border-b border-border/20 pb-0.5">
              <span className="font-semibold">Saygı Seviyesi</span>
              <span className={`font-bold ${tier.color}`}>{tier.label}</span>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Oyuncunun saygı puanı: <span className="font-bold font-mono">{respectPoints}/100</span>
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}