"use client";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PROFILE_ICON_URL } from "@/lib/constants";
import type { QueuePlayer } from "@/types";
import { TIER_LABELS } from "@/types";
import {
  Dices,
  FastForward,
  RotateCcw,
  Shield,
  Sparkles,
  Trash2,
  Trophy,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Crypto-strength random number [0, max)
function cryptoRand(max: number): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % max;
}

// Fisher-Yates shuffle with crypto random
function cryptoShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = cryptoRand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Caelestia palette colors for wheel segments — alternating 0-1-0-1
const WHEEL_COLORS = [
  "#3b3628", // primary (dark)
  "#e8e2d7", // secondary container (light)
] as const;

// Text color per segment — white on dark, dark on light
const WHEEL_TEXT_COLORS = ["#ffffff", "#1c1b1a"] as const;

function WinnerBadge() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground animate-in zoom-in duration-300 cursor-default">
          <Trophy className="h-3.5 w-3.5" />
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        className="bg-primary text-primary-foreground border-primary"
      >
        <p>Kazanan! 🏆</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface SinglePickDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  players: QueuePlayer[];
  pickRandomPlayer: (onlyInGame?: boolean) => QueuePlayer | null;
  onlyInGame?: boolean;
  onRemoveFromTeam?: (playerId: string) => void;
  animationStyle?: "classic" | "list" | "spin" | "none";
}

export function SinglePickDialog({
  open,
  onOpenChange,
  players,
  pickRandomPlayer,
  onlyInGame = false,
  onRemoveFromTeam,
  animationStyle = "classic",
}: SinglePickDialogProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentDisplay, setCurrentDisplay] = useState<QueuePlayer | null>(
    null,
  );
  const [finalPick, setFinalPick] = useState<QueuePlayer | null>(null);
  const [showEmpty, setShowEmpty] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Skip reference states to allow keydown access
  const pickedPlayerRef = useRef<QueuePlayer | null>(null);
  const targetRotationRef = useRef<number>(0);

  // List animation state
  const [listItems, setListItems] = useState<QueuePlayer[]>([]);
  const [listOffset, setListOffset] = useState(0);
  const listAnimRef = useRef<number | null>(null);

  // Spin (çark) animation state
  const [spinRotation, setSpinRotation] = useState(0);
  const [spinPlayers, setSpinPlayers] = useState<QueuePlayer[]>([]);
  const [spinWinnerIndex, setSpinWinnerIndex] = useState(-1);
  const spinAnimRef = useRef<number | null>(null);

  const activePlayers = useMemo(
    () => players.filter((p) => !p.isAway && (!onlyInGame || p.isInGame)),
    [players, onlyInGame],
  );

  // === Classic Animation ===
  const runClassicAnimation = useCallback(() => {
    if (activePlayers.length === 0) {
      setShowEmpty(true);
      return;
    }
    setIsAnimating(true);
    setFinalPick(null);

    const picked = pickRandomPlayer(onlyInGame);
    if (!picked) {
      setShowEmpty(true);
      return;
    }
    pickedPlayerRef.current = picked;

    const shuffled = cryptoShuffle(activePlayers);
    const totalCycles = Math.min(shuffled.length * 2 + 5, 25);
    let cycle = 0;
    let speed = 60;

    const animate = () => {
      if (cycle >= totalCycles) {
        setCurrentDisplay(picked);
        setFinalPick(picked);
        setIsAnimating(false);
        return;
      }
      setCurrentDisplay(shuffled[cycle % shuffled.length]);
      cycle++;
      speed = 60 + cycle * 18;
      timeoutRef.current = setTimeout(animate, speed);
    };
    animate();
  }, [activePlayers, pickRandomPlayer, onlyInGame]);

  // === List (Liste Çekimi) Animation ===
  const runListAnimation = useCallback(() => {
    if (activePlayers.length === 0) {
      setShowEmpty(true);
      return;
    }
    setIsAnimating(true);
    setFinalPick(null);

    const picked = pickRandomPlayer(onlyInGame);
    if (!picked) {
      setShowEmpty(true);
      return;
    }
    pickedPlayerRef.current = picked;

    const stripLength = Math.max(activePlayers.length * 3, 15);
    const strip: QueuePlayer[] = [];
    for (let i = 0; i < stripLength - 1; i++) {
      strip.push(activePlayers[cryptoRand(activePlayers.length)]);
    }
    strip.push(picked);

    setListItems(strip);
    setListOffset(0);
    setCurrentDisplay(strip[0]);

    const totalDuration = 2800;
    const startTime = performance.now();
    const totalDistance = (strip.length - 1) * 72;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);
      const offset = easeOutCubic(progress) * totalDistance;
      setListOffset(offset);
      const idx = Math.min(Math.floor(offset / 72), strip.length - 1);
      setCurrentDisplay(strip[idx]);

      if (progress < 1) {
        listAnimRef.current = requestAnimationFrame(step);
      } else {
        setCurrentDisplay(picked);
        setFinalPick(picked);
        setIsAnimating(false);
      }
    };
    listAnimRef.current = requestAnimationFrame(step);
  }, [activePlayers, pickRandomPlayer, onlyInGame]);

  // === Spin (Çark Çekimi) Animation ===
  const runSpinAnimation = useCallback(() => {
    if (activePlayers.length === 0) {
      setShowEmpty(true);
      return;
    }
    setIsAnimating(true);
    setFinalPick(null);
    setCurrentDisplay(null);

    const picked = pickRandomPlayer(onlyInGame);
    if (!picked) {
      setShowEmpty(true);
      return;
    }
    pickedPlayerRef.current = picked;

    const wheelPlayers = cryptoShuffle(activePlayers);
    const winnerIdx = wheelPlayers.findIndex((p) => p.id === picked.id);
    setSpinPlayers(wheelPlayers);
    setSpinWinnerIndex(winnerIdx);

    const n = wheelPlayers.length;
    const segAngle = 360 / n;
    const winnerCenterAngle = (winnerIdx + 0.5) * segAngle;
    const fullSpins = 5 + cryptoRand(3);
    const targetRotation =
      fullSpins * 360 + ((360 - winnerCenterAngle + 270) % 360);

    targetRotationRef.current = targetRotation;
    setSpinRotation(0);

    const totalDuration = 4000;
    const startTime = performance.now();
    const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);
      const rotation = easeOutQuint(progress) * targetRotation;
      setSpinRotation(rotation);

      if (progress < 1) {
        spinAnimRef.current = requestAnimationFrame(step);
      } else {
        setSpinRotation(targetRotation);
        setCurrentDisplay(picked);
        setFinalPick(picked);
        setIsAnimating(false);
      }
    };
    spinAnimRef.current = requestAnimationFrame(step);
  }, [activePlayers, pickRandomPlayer, onlyInGame]);

  // === No Animation ===
  const runNoAnimation = useCallback(() => {
    if (activePlayers.length === 0) {
      setShowEmpty(true);
      return;
    }
    const picked = pickRandomPlayer(onlyInGame);
    pickedPlayerRef.current = picked;
    setCurrentDisplay(picked);
    setFinalPick(picked);
  }, [activePlayers, pickRandomPlayer, onlyInGame]);

  const runAnimation = useCallback(() => {
    switch (animationStyle) {
      case "list":
        runListAnimation();
        break;
      case "spin":
        runSpinAnimation();
        break;
      case "none":
        runNoAnimation();
        break;
      case "classic":
      default:
        runClassicAnimation();
        break;
    }
  }, [
    animationStyle,
    runClassicAnimation,
    runListAnimation,
    runSpinAnimation,
    runNoAnimation,
  ]);

  useEffect(() => {
    if (open) {
      setFinalPick(null);
      setCurrentDisplay(null);
      setListItems([]);
      setListOffset(0);
      setSpinRotation(0);
      setSpinPlayers([]);
      setSpinWinnerIndex(-1);
      pickedPlayerRef.current = null;
      targetRotationRef.current = 0;
      const timer = setTimeout(() => runAnimation(), 300);
      return () => clearTimeout(timer);
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (listAnimRef.current) cancelAnimationFrame(listAnimRef.current);
      if (spinAnimRef.current) cancelAnimationFrame(spinAnimRef.current);
    }
  }, [open, runAnimation]);

  const skipAnimation = useCallback(() => {
    if (!isAnimating) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (listAnimRef.current) cancelAnimationFrame(listAnimRef.current);
    if (spinAnimRef.current) cancelAnimationFrame(spinAnimRef.current);

    const picked = pickedPlayerRef.current;
    if (picked) {
      if (animationStyle === "spin") {
        setSpinRotation(targetRotationRef.current);
      }
      setCurrentDisplay(picked);
      setFinalPick(picked);
    }
    setIsAnimating(false);
  }, [isAnimating, animationStyle]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (listAnimRef.current) cancelAnimationFrame(listAnimRef.current);

      if (spinAnimRef.current) cancelAnimationFrame(spinAnimRef.current);
    };
  }, []);

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
            <AlertDialogAction
              onClick={() => {
                setShowEmpty(false);
                onOpenChange(false);
              }}
            >
              Tamam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Render the SVG fortune wheel
  const renderSpinWheel = () => {
    const n = spinPlayers.length;
    if (n === 0) return null;
    const size = 300;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 4;
    const segAngle = 360 / n;

    const segments = spinPlayers.map((player, i) => {
      const startAngle = (i * segAngle * Math.PI) / 180;
      const endAngle = ((i + 1) * segAngle * Math.PI) / 180;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const largeArc = segAngle > 180 ? 1 : 0;
      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      const midAngle = ((i + 0.5) * segAngle * Math.PI) / 180;
      const labelR = r * 0.62;
      const lx = cx + labelR * Math.cos(midAngle);
      const ly = cy + labelR * Math.sin(midAngle);
      const labelRotation = (i + 0.5) * segAngle;

      return (
        <g key={player.id + "-" + i}>
          <path
            d={path}
            fill={WHEEL_COLORS[i % WHEEL_COLORS.length]}
            stroke="#ccc6bb"
            strokeWidth="1"
          />
          <text
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="central"
            transform={`rotate(${labelRotation}, ${lx}, ${ly})`}
            fill={WHEEL_TEXT_COLORS[i % WHEEL_TEXT_COLORS.length]}
            fontSize={n > 8 ? 10 : n > 5 ? 12 : 14}
            fontWeight="700"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {player.riotGameName.length > 10
              ? player.riotGameName.slice(0, 9) + "…"
              : player.riotGameName}
          </text>
        </g>
      );
    });

    return (
      <div className="relative flex items-center justify-center">
        {/* Pointer at top */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20">
          <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent border-t-foreground drop-shadow-md" />
        </div>

        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="drop-shadow-xl"
          style={{
            transform: `rotate(${spinRotation}deg)`,
            transition: isAnimating ? "none" : "transform 0.2s ease-out",
          }}
        >
          {segments}
          {/* Center hub */}
          <circle
            cx={cx}
            cy={cy}
            r={22}
            fill="#fdf8f5"
            stroke="#ccc6bb"
            strokeWidth="2"
          />
          <circle cx={cx} cy={cy} r={18} fill="#3b3628" />
          {!isAnimating && !finalPick && (
            <polygon
              points={`${cx - 6},${cy - 4} ${cx - 6},${cy + 4} ${cx + 7},${cy}`}
              fill="white"
            />
          )}
          {finalPick && (
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize="14"
              fontWeight="900"
            >
              ★
            </text>
          )}
        </svg>
      </div>
    );
  };

  const showSpinResult = animationStyle === "spin" && finalPick && !isAnimating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={animationStyle === "spin" ? "sm:max-w-sm" : "sm:max-w-md"}
        id="single-pick-dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-warning" />
            Seçilen Oyuncu
          </DialogTitle>
          <DialogDescription>
            {isAnimating
              ? "Çekiliş yapılıyor..."
              : "Sıradan rastgele bir oyuncu seçildi."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* === Spin (Çark Çekimi) Mode === */}
          {animationStyle === "spin" &&
          spinPlayers.length > 0 &&
          !showSpinResult ? (
            <div className="flex flex-col items-center gap-4">
              {renderSpinWheel()}
            </div>
          ) : null}

          {/* === Spin Result Card === */}
          {showSpinResult ? (
            <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
              <div className="relative">
                <Avatar className="h-20 w-20 ring-4 ring-primary shadow-lg shadow-primary/20">
                  {finalPick.profileIconId ? (
                    <AvatarImage
                      src={PROFILE_ICON_URL(finalPick.profileIconId)}
                      alt={finalPick.riotGameName}
                    />
                  ) : null}
                  <AvatarFallback className="text-xl font-bold">
                    {finalPick.riotGameName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <WinnerBadge />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{finalPick.riotGameName}</p>
                <p className="text-sm text-muted-foreground">
                  #{finalPick.riotTagLine}
                </p>
              </div>
              {finalPick.rankedTier && (
                <Badge
                  variant="secondary"
                  className="gap-1.5 px-3 py-1 text-sm"
                >
                  <Shield className="h-3.5 w-3.5" />
                  {TIER_LABELS[finalPick.rankedTier]}
                  {finalPick.rankedTier !== "UNRANKED" &&
                    !["MASTER", "GRANDMASTER", "CHALLENGER"].includes(
                      finalPick.rankedTier,
                    ) &&
                    ` ${finalPick.rankedDivision}`}
                  {finalPick.leaguePoints !== undefined &&
                    finalPick.rankedTier !== "UNRANKED" &&
                    ` — ${finalPick.leaguePoints} LP`}
                </Badge>
              )}
              <p className="text-xs text-muted-foreground">
                Kick:{" "}
                <span className="font-medium">{finalPick.kickUsername}</span>
              </p>
            </div>
          ) : null}

          {/* === List (Liste Çekimi) Mode === */}
          {animationStyle === "list" && isAnimating && listItems.length > 0 ? (
            <div className="relative h-[72px] overflow-hidden rounded-xl border border-border/50 bg-muted/30 mx-4">
              <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                <div className="w-full h-[72px] border-2 border-primary/40 rounded-xl bg-primary/5" />
              </div>
              <div
                className="absolute left-0 right-0"
                style={{ transform: `translateY(-${listOffset}px)` }}
              >
                {listItems.map((player, i) => (
                  <div
                    key={`${player.id}-${i}`}
                    className="flex items-center gap-3 px-4 h-[72px]"
                  >
                    <Avatar className="h-10 w-10 ring-2 ring-border/50 shrink-0">
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
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">
                        {player.riotGameName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        #{player.riotTagLine}
                      </p>
                    </div>
                    {player.rankedTier && player.rankedTier !== "UNRANKED" && (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {TIER_LABELS[player.rankedTier]}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* === Classic / None / Result Display (non-spin) === */}
          {animationStyle !== "spin" &&
          !(
            animationStyle === "list" &&
            isAnimating &&
            listItems.length > 0
          ) ? (
            <div
              className={`flex flex-col items-center gap-4 transition-all duration-300 ${isAnimating ? "scale-95 opacity-80" : "scale-100 opacity-100"}`}
            >
              {currentDisplay ? (
                <>
                  <div
                    className={`relative ${isAnimating ? "animate-pulse" : ""}`}
                  >
                    <Avatar
                      className={`h-20 w-20 ring-4 transition-all duration-300 ${finalPick ? "ring-primary shadow-lg shadow-primary/20" : "ring-border"}`}
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
                    {finalPick && <WinnerBadge />}
                  </div>
                  <div className="text-center">
                    <p
                      className={`text-xl font-bold transition-all duration-200 ${isAnimating ? "blur-[1px]" : ""}`}
                    >
                      {currentDisplay.riotGameName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      #{currentDisplay.riotTagLine}
                    </p>
                  </div>
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
                            finalPick.rankedTier,
                          ) &&
                          ` ${finalPick.rankedDivision}`}
                        {finalPick.leaguePoints !== undefined &&
                          finalPick.rankedTier !== "UNRANKED" &&
                          ` — ${finalPick.leaguePoints} LP`}
                      </Badge>
                    </div>
                  )}
                  {finalPick && (
                    <p className="text-xs text-muted-foreground animate-in fade-in duration-500 delay-300">
                      Kick:{" "}
                      <span className="font-medium">
                        {finalPick.kickUsername}
                      </span>
                    </p>
                  )}
                </>
              ) : (
                <div className="flex h-32 items-center justify-center">
                  <Dices className="h-12 w-12 text-muted-foreground/30 animate-spin" />
                </div>
              )}
            </div>
          ) : null}
        </div>

        <Separator />

        {/* Actions */}
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
              setListItems([]);
              setListOffset(0);
              setSpinRotation(0);
              setSpinPlayers([]);
              setSpinWinnerIndex(-1);
              setTimeout(() => runAnimation(), 100);
            }}
            disabled={isAnimating}
            variant="outline"
            className="gap-2"
            id="repick-button"
          >
            <RotateCcw
              className={`h-4 w-4 ${isAnimating ? "animate-spin" : ""}`}
            />
            Tekrar Çek
          </Button>
          {isAnimating && (
            <Button
              onClick={skipAnimation}
              variant="default"
              className="gap-2 cursor-pointer animate-in fade-in zoom-in duration-300 hover:scale-105 active:scale-95 bg-primary text-primary-foreground hover:bg-primary/90"
              id="skip-animation-button"
            >
              <FastForward className="h-4 w-4" />
              Atla
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
