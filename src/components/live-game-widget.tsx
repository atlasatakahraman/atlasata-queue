"use client";

import { useEffect, useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ActiveGameSnapshot } from "@/lib/riot/types";
import { Gamepad2, Timer, Users } from "lucide-react";

interface LiveGameWidgetProps {
  game: ActiveGameSnapshot;
}

const GAME_MODE_LABELS: Record<string, string> = {
  CLASSIC: "Normal",
  ARAM: "ARAM",
  URF: "URF",
  ONEFORALL: "Hepsi Bir",
  CHERRY: "Arena",
  TUTORIAL: "Eğitim",
  PRACTICETOOL: "Antrenman",
};

export function LiveGameWidget({ game }: LiveGameWidgetProps) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const startTime = game.gameStartTime;
    if (!startTime || startTime === 0) {
      setElapsed(game.gameLength);
      return;
    }

    const update = () => {
      const now = Date.now();
      const seconds = Math.floor((now - startTime) / 1000);
      setElapsed(Math.max(0, seconds));
    };

    update();
    intervalRef.current = setInterval(update, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [game.gameStartTime, game.gameLength]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const team100 = game.participants.filter((p) => p.teamId === 100);
  const team200 = game.participants.filter((p) => p.teamId === 200);

  const modeLabel = GAME_MODE_LABELS[game.gameMode] ?? game.gameMode;

  return (
    <Card className="border-border/50 overflow-hidden animate-card-enter relative">
      {/* Live pulse indicator bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse-soft" />

      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </div>
            <CardTitle className="text-sm font-medium">
              Canlı Maç
            </CardTitle>
            <Badge
              variant="secondary"
              className="text-[10px] font-medium"
            >
              {modeLabel}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Timer className="h-3.5 w-3.5" />
                  <span className="font-mono text-sm font-medium text-foreground tabular-nums">
                    {formattedTime}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Maç süresi</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Team Blue */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Mavi Takım
              </span>
            </div>
            {team100.map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <div className="h-5 w-5 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://ddragon.leagueoflegends.com/cdn/15.7.1/img/champion/${getChampionName(p.championId)}.png`}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
                <span className="truncate">{p.summonerName}</span>
              </div>
            ))}
          </div>

          {/* Team Red */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                Kırmızı Takım
              </span>
            </div>
            {team200.map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <div className="h-5 w-5 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://ddragon.leagueoflegends.com/cdn/15.7.1/img/champion/${getChampionName(p.championId)}.png`}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
                <span className="truncate">{p.summonerName}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-muted-foreground/60">
          <Users className="h-3 w-3" />
          <span>{game.participants.length} oyuncu</span>
          <span>·</span>
          <Gamepad2 className="h-3 w-3" />
          <span>Harita {game.mapId}</span>
        </div>
      </CardContent>
    </Card>
  );
}

/** Champion ID to name mapping for common champions (fallback to ID) */
function getChampionName(id: number): string {
  // Use a basic mapping for common champs. In production, this would come from DDragon data.
  // For now, we return the ID as string — the DDragon URL will 404 but we have onError fallback.
  return CHAMPION_ID_MAP[id] ?? String(id);
}

const CHAMPION_ID_MAP: Record<number, string> = {
  1: "Annie", 2: "Olaf", 3: "Galio", 4: "TwistedFate", 5: "XinZhao",
  6: "Urgot", 7: "LeBlanc", 8: "Vladimir", 9: "Fiddlesticks", 10: "Kayle",
  11: "MasterYi", 12: "Alistar", 13: "Ryze", 14: "Sion", 15: "Sivir",
  16: "Soraka", 17: "Teemo", 18: "Tristana", 19: "Warwick", 20: "Nunu",
  21: "MissFortune", 22: "Ashe", 23: "Tryndamere", 24: "Jax", 25: "Morgana",
  26: "Zilean", 27: "Singed", 28: "Evelynn", 29: "Twitch", 30: "Karthus",
  31: "Chogath", 32: "Amumu", 33: "Rammus", 34: "Anivia", 35: "Shaco",
  36: "DrMundo", 37: "Sona", 38: "Kassadin", 39: "Irelia", 40: "Janna",
  41: "Gangplank", 42: "Corki", 43: "Karma", 44: "Taric", 45: "Veigar",
  48: "Trundle", 50: "Swain", 51: "Caitlyn", 53: "Blitzcrank", 54: "Malphite",
  55: "Katarina", 56: "Nocturne", 57: "Maokai", 58: "Renekton", 59: "JarvanIV",
  60: "Elise", 61: "Orianna", 62: "MonkeyKing", 63: "Brand", 64: "LeeSin",
  67: "Vayne", 68: "Rumble", 69: "Cassiopeia", 72: "Skarner", 74: "Heimerdinger",
  75: "Nasus", 76: "Nidalee", 77: "Udyr", 78: "Poppy", 79: "Gragas",
  80: "Pantheon", 81: "Ezreal", 82: "Mordekaiser", 83: "Yorick", 84: "Akali",
  85: "Kennen", 86: "Garen", 89: "Leona", 90: "Malzahar", 91: "Talon",
  92: "Riven", 96: "KogMaw", 98: "Shen", 99: "Lux", 101: "Xerath",
  102: "Shyvana", 103: "Ahri", 104: "Graves", 105: "Fizz", 106: "Volibear",
  107: "Rengar", 110: "Varus", 111: "Nautilus", 112: "Viktor", 113: "Sejuani",
  114: "Fiora", 115: "Ziggs", 117: "Lulu", 119: "Draven", 120: "Hecarim",
  121: "Khazix", 122: "Darius", 126: "Jayce", 127: "Lissandra", 131: "Diana",
  133: "Quinn", 134: "Syndra", 136: "AurelionSol", 141: "Kayn", 142: "Zoe",
  143: "Zyra", 145: "Kaisa", 147: "Seraphine", 150: "Gnar", 154: "Zac",
  157: "Yasuo", 161: "VelKoz", 163: "Taliyah", 164: "Camille",
  166: "Akshan", 200: "Belveth", 201: "Braum", 202: "Jhin", 203: "Kindred",
  221: "Zeri", 222: "Jinx", 223: "TahmKench", 233: "Briar", 234: "Viego",
  235: "Senna", 236: "Lucian", 238: "Zed", 240: "Kled", 245: "Ekko",
  246: "Qiyana", 254: "Vi", 266: "Aatrox", 267: "Nami", 268: "Azir",
  350: "Yuumi", 360: "Samira", 412: "Thresh", 420: "Illaoi", 421: "RekSai",
  427: "Ivern", 429: "Kalista", 432: "Bard", 497: "Rakan", 498: "Xayah",
  516: "Ornn", 517: "Sylas", 518: "Neeko", 523: "Aphelios", 526: "Rell",
  555: "Pyke", 711: "Vex", 777: "Yone", 799: "Ambessa",
  875: "Sett", 876: "Lillia", 887: "Gwen",
  888: "Renata", 893: "Aurora", 895: "Nilah", 897: "KSante",
  901: "Smolder", 902: "Milio", 910: "Hwei", 950: "Naafiri",
};
