import type { AppSettings } from "@/types";

export const DEFAULT_SETTINGS: AppSettings = {
  riotApiKey: "",
  riotRegion: "tr1",
  riotRoutingRegion: "europe",
  teamSize: 5,
  kickChannelName: "",
  queueCommand: "!sıra",
  afkCommand: "!afk",
  disableRiotApi: false,
};

export const KICK_WS_URL = "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=7.6.0&flash=false";

export const RIOT_DDRAGON_BASE = "https://ddragon.leagueoflegends.com";

export const PROFILE_ICON_URL = (iconId: number) =>
  `${RIOT_DDRAGON_BASE}/cdn/15.7.1/img/profileicon/${iconId}.png`;

export const RANK_EMBLEM_URL = (tier: string) =>
  `/ranks/${tier.toLowerCase()}.webp`;

export const TEAM_NAMES = {
  A: "Mavi Takım",
  B: "Kırmızı Takım",
} as const;

export const QUEUE_COMMAND = "!sıra";
