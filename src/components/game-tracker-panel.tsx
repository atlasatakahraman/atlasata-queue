"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { UseGameTrackerReturn } from "@/hooks/use-game-tracker";
import { PROFILE_ICON_URL } from "@/lib/constants";
import type { RiotRegion } from "@/types";
import { Download, Loader2, PowerOff, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { MatchHistory } from "./match-history";
import { MatchResultCard } from "./match-result";

const REGION_SHORT_CODES: Record<string, string> = {
  tr1: "TR",
  euw1: "EUW",
  eun1: "EUNE",
  na1: "NA",
  kr: "KR",
  jp1: "JP",
  br1: "BR",
  la1: "LAN",
  la2: "LAS",
  oc1: "OCE",
  ru: "RU",
  ph2: "PH",
  sg2: "SG",
  th2: "TH",
  tw2: "TW",
  vn2: "VN",
};

/** localStorage key for cached Riot ID per-browser session */
const CACHED_RIOT_ID_KEY = "theatlas_cached_riot_id";

interface GameTrackerPanelProps {
  tracker: UseGameTrackerReturn;
  defaultRegion: RiotRegion;
  enableToasts?: boolean;
  onAddPlayerToQueue?: (riotGameName: string, riotTagLine: string) => void;
  onModeratePlayer?: (kickUsername: string, actionType: "warning" | "punishment" | "ban") => void;
}

export function GameTrackerPanel({
  tracker,
  defaultRegion,
  enableToasts = true,
  onAddPlayerToQueue,
  onModeratePlayer,
}: GameTrackerPanelProps) {
  // Seed input from tracked account OR cached Riot ID for persistence
  const [riotIdInput, setRiotIdInput] = useState<string>(() => {
    if (tracker.trackedAccount) {
      return `${tracker.trackedAccount.gameName}#${tracker.trackedAccount.tagLine}`;
    }
    if (typeof window !== "undefined") {
      return localStorage.getItem(CACHED_RIOT_ID_KEY) ?? "";
    }
    return "";
  });

  // Keep input in sync when tracked account changes from outside (e.g. stopTracking)
  useEffect(() => {
    if (tracker.trackedAccount) {
      const id = `${tracker.trackedAccount.gameName}#${tracker.trackedAccount.tagLine}`;
      setRiotIdInput(id);
      // Persist to cache so next page load restores it
      try {
        localStorage.setItem(CACHED_RIOT_ID_KEY, id);
      } catch {
        // ignore
      }
    }
  }, [tracker.trackedAccount]);

  const showToast = useCallback(
    (
      type: "success" | "error" | "info" | "warning",
      title: string,
      opts?: { description?: string },
    ) => {
      if (!enableToasts) return;
      toast[type](title, opts);
    },
    [enableToasts],
  );

  const handleResolve = useCallback(async () => {
    const trimmed = riotIdInput.trim();
    const hashIndex = trimmed.indexOf("#");
    if (hashIndex === -1) {
      showToast("error", "Geçersiz Riot ID", {
        description: "Format: İsim#TAG",
      });
      return;
    }

    const finalGameName = trimmed.substring(0, hashIndex).trim();
    const finalTagLine = trimmed.substring(hashIndex + 1).trim();

    if (!finalGameName || !finalTagLine) {
      showToast("error", "Geçersiz Riot ID", {
        description: "İsim ve TAG alanları boş olamaz",
      });
      return;
    }

    const success = await tracker.resolveAndTrack(
      finalGameName,
      finalTagLine,
      defaultRegion,
    );

    if (success) {
      showToast("success", "Maç Geçmişi Yüklendi", {
        description: `${finalGameName}#${finalTagLine} oyuncusunun maçları getirildi`,
      });
    } else {
      showToast("error", "Oyuncu Bulunamadı", {
        description: "Riot ID hatalı veya mevcut bölgede bulunamadı",
      });
    }
  }, [riotIdInput, defaultRegion, tracker, showToast]);

  const handleStop = useCallback(() => {
    tracker.stopTracking();
    showToast("info", "Sorgu Temizlendi");
  }, [tracker, showToast]);

  const handleClearHistory = useCallback(() => {
    tracker.clearHistory();
    showToast("info", "Geçmiş Temizlendi");
  }, [tracker, showToast]);

  const handleFetchRecent = useCallback(async () => {
    const count = await tracker.fetchRecentMatches();
    if (count > 0) {
      showToast("success", "Maç Geçmişi Güncellendi", {
        description: `${count} yeni karşılaşma eklendi`,
      });
    } else {
      showToast("info", "Yeni Karşılaşma Yok", {
        description: "En güncel maçlar zaten listeleniyor",
      });
    }
  }, [tracker, showToast]);

  return (
    <div className="space-y-4">
      {/* Search / Account card — always visible */}
      <Card className="border-border/50 animate-card-enter" style={{ animationDelay: "0ms" }}>
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 gap-4">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Search className="h-3.5 w-3.5" />
              Maç Geçmişi Sorgula
            </CardTitle>
            <CardDescription className="text-xs">
              Riot ID girerek oyuncunun güncel özel maç geçmişini listeleyin
            </CardDescription>
          </div>

          {/* Active account badge */}
          {tracker.trackedAccount && (
            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-secondary/50 border border-border/50 shadow-sm animate-fade-in">
                {tracker.trackedAccount.profileIconId ? (
                  <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted border border-border/20 shadow-inner shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={PROFILE_ICON_URL(tracker.trackedAccount.profileIconId)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-muted border border-border/20 flex items-center justify-center font-bold text-sm shrink-0">
                    {(tracker.trackedAccount.gameName || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-left hidden sm:block min-w-0">
                  <p className="text-sm font-bold leading-none text-foreground truncate">
                    {tracker.trackedAccount.gameName}
                    <span className="text-xs text-muted-foreground font-semibold ml-0.5">
                      #{tracker.trackedAccount.tagLine}
                    </span>
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-none mt-1 font-semibold">
                    {REGION_SHORT_CODES[tracker.trackedAccount.region] ??
                      tracker.trackedAccount.region.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 mt-1">
                <div className="h-1.5 w-1.5 rounded-full bg-success shrink-0" />

                <span className="text-[10px] text-success font-semibold leading-none">
                  Takip aktif
                </span>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Riot ID (İsim#TAG)
            </p>
            <Input
              id="riot-id-input"
              placeholder="İsim#TAG"
              value={riotIdInput}
              onChange={(e) => setRiotIdInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleResolve();
              }}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleResolve}
              disabled={!riotIdInput.trim() || tracker.isResolving}
              className="flex-1 h-9 gap-2"
              size="sm"
            >
              {tracker.isResolving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Çözümleniyor...
                </>
              ) : (
                <>
                  <Search className="h-3.5 w-3.5" />
                  Sorgula
                </>
              )}
            </Button>

            {tracker.trackedAccount && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1.5"
                      onClick={handleFetchRecent}
                      disabled={tracker.isFetchingMatches}
                    >
                      {tracker.isFetchingMatches ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      <span className="hidden sm:inline">Güncelle</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Son maçları getir</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={handleStop}
                    >
                      <PowerOff className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Takibi durdur</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>

        </CardContent>
      </Card>

      {/* Latest / selected match detail */}
      {tracker.latestMatch && (
        <div className="animate-card-enter" style={{ animationDelay: "60ms" }}>
          <MatchResultCard
            match={tracker.latestMatch}
            onDismiss={tracker.dismissLatestMatch}
            onAddPlayerToQueue={onAddPlayerToQueue}
            onModeratePlayer={onModeratePlayer}
          />
        </div>
      )}

      {/* Full history list */}
      <div className="animate-card-enter" style={{ animationDelay: "80ms" }}>
        <MatchHistory
          matches={tracker.matchHistory}
          onClear={handleClearHistory}
          onSelectMatch={tracker.selectMatch}
        />
      </div>
    </div>
  );
}
