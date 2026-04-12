"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { QueuePlayer } from "@/types";
import { TIER_LABELS } from "@/types";
import { PROFILE_ICON_URL } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dices, RotateCcw, Sparkles, Shield, Trophy, Trash2 } from "lucide-react";

interface SinglePickDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  players: QueuePlayer[];
  pickRandomPlayer: (onlyInGame?: boolean) => QueuePlayer | null;
  onlyInGame?: boolean;
  onRemoveFromTeam?: (playerId: string) => void;
}

export function SinglePickDialog({
  open,
  onOpenChange,
  players,
  pickRandomPlayer,
  onlyInGame = false,
  onRemoveFromTeam,
}: SinglePickDialogProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentDisplay, setCurrentDisplay] = useState<QueuePlayer | null>(null);
  const [finalPick, setFinalPick] = useState<QueuePlayer | null>(null);
  const [showEmpty, setShowEmpty] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activePlayers = useMemo(() => players.filter(p => !p.isAway && (!onlyInGame || p.isInGame)), [players, onlyInGame]);

  const runAnimation = useCallback(() => {
    if (activePlayers.length === 0) {
      setShowEmpty(true);
      return;
    }

    setIsAnimating(true);
    setFinalPick(null);

    let cycles = 0;
    const totalCycles = 20;
    let speed = 60;

    const animate = () => {
      if (cycles >= totalCycles) {
        // Final pick
        const picked = pickRandomPlayer(onlyInGame);
        setCurrentDisplay(picked);
        setFinalPick(picked);
        setIsAnimating(false);
        return;
      }

      // Cycle through random active players
      const randomIndex = Math.floor(Math.random() * activePlayers.length);
      setCurrentDisplay(activePlayers[randomIndex]);
      cycles++;

      // Gradually slow down
      speed = 60 + cycles * 15;
      timeoutRef.current = setTimeout(animate, speed);
    };

    animate();
  }, [activePlayers, pickRandomPlayer]);

  // Trigger animation when dialog opens
  useEffect(() => {
    if (open) {
      setFinalPick(null);
      setCurrentDisplay(null);
      // Small delay before starting animation
      const timer = setTimeout(() => runAnimation(), 300);
      return () => clearTimeout(timer);
    } else {
      // Cleanup
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, [open, runAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Empty state alert
  if (showEmpty) {
    return (
      <AlertDialog open={showEmpty} onOpenChange={setShowEmpty}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sırada aktif oyuncu bulunmuyor</AlertDialogTitle>
            <AlertDialogDescription>
              Rastgele oyuncu seçebilmek için sırada en az bir oyuncu
              bulunmalıdır. Kick sohbetinden{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
                !sıra İsim#TAG
              </code>{" "}
              komutuyla oyuncu ekleyebilirsiniz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => { setShowEmpty(false); onOpenChange(false); }}>
              Tamam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" id="single-pick-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-warning" />
            Seçilen Oyuncu
          </DialogTitle>
          <DialogDescription>
            Sıradan rastgele bir oyuncu seçildi.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {/* Animation / Result Display */}
          <div
            className={`flex flex-col items-center gap-4 transition-all duration-300 ${isAnimating ? "scale-95 opacity-80" : "scale-100 opacity-100"
              }`}
          >
            {currentDisplay ? (
              <>
                {/* Profile Icon */}
                <div
                  className={`relative ${isAnimating ? "animate-pulse" : ""}`}
                >
                  <Avatar
                    className={`h-20 w-20 ring-4 transition-all duration-300 ${finalPick
                        ? "ring-primary shadow-lg shadow-primary/20"
                        : "ring-border"
                      }`}
                  >
                    {currentDisplay.profileIconId ? (
                      <AvatarImage
                        src={PROFILE_ICON_URL(currentDisplay.profileIconId)}
                        alt={currentDisplay.riotGameName}
                      />
                    ) : null}
                    <AvatarFallback className="text-xl font-bold">
                      {currentDisplay.riotGameName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {finalPick && (
                    <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-warning text-warning-foreground animate-in zoom-in duration-300">
                      <Trophy className="h-3.5 w-3.5 text-background" />
                    </div>
                  )}
                </div>

                {/* Player Name */}
                <div className="text-center">
                  <p
                    className={`text-xl font-bold transition-all duration-200 ${isAnimating ? "blur-[1px]" : ""
                      }`}
                  >
                    {currentDisplay.riotGameName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    #{currentDisplay.riotTagLine}
                  </p>
                </div>

                {/* Rank Badge (only show on final) */}
                {finalPick && finalPick.rankedTier && (
                  <div className="animate-in fade-in zoom-in duration-500 delay-200">
                    <Badge
                      variant="secondary"
                      className="gap-1.5 px-3 py-1 text-sm"
                    >
                      <Shield className="h-3.5 w-3.5" />
                      {TIER_LABELS[finalPick.rankedTier]}
                      {finalPick.rankedTier !== "UNRANKED" &&
                        !["MASTER", "GRANDMASTER", "CHALLENGER"].includes(
                          finalPick.rankedTier
                        ) &&
                        ` ${finalPick.rankedDivision}`}
                      {finalPick.leaguePoints !== undefined &&
                        finalPick.rankedTier !== "UNRANKED" &&
                        ` — ${finalPick.leaguePoints} LP`}
                    </Badge>
                  </div>
                )}

                {/* Kick username (only on final) */}
                {finalPick && (
                  <p className="text-xs text-muted-foreground animate-in fade-in duration-500 delay-300">
                    Kick: <span className="font-medium">{finalPick.kickUsername}</span>
                  </p>
                )}
              </>
            ) : (
              <div className="flex h-32 items-center justify-center">
                <Dices className="h-12 w-12 text-muted-foreground/30 animate-spin" />
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Re-pick Button and Remove Button */}
        <div className="flex justify-center pt-2 gap-2">
          {onlyInGame && finalPick && onRemoveFromTeam && (
            <Button
              onClick={() => {
                onRemoveFromTeam(finalPick.id);
                onOpenChange(false);
              }}
              disabled={isAnimating}
              variant="destructive"
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Takımdan Çıkar
            </Button>
          )}
          <Button
            onClick={() => {
              setFinalPick(null);
              setCurrentDisplay(null);
              setTimeout(() => runAnimation(), 100);
            }}
            disabled={isAnimating}
            variant="outline"
            className="gap-2"
            id="repick-button"
          >
            <RotateCcw className={`h-4 w-4 ${isAnimating ? "animate-spin" : ""}`} />
            Tekrar Çek
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
