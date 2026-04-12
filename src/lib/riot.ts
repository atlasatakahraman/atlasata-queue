import type {
  RiotAccountData,
  RiotSummonerData,
  RiotRankedEntry,
  RiotRegion,
  RiotRoutingRegion,
  QueuePlayer,
} from "@/types";
import { REGION_TO_ROUTING } from "@/types";

/**
 * Riot API wrapper — all calls go through our API route to avoid
 * exposing the API key client-side.
 */

const RIOT_API_BASE = (region: RiotRegion) =>
  `https://${region}.api.riotgames.com`;

const RIOT_ROUTING_BASE = (routing: RiotRoutingRegion) =>
  `https://${routing}.api.riotgames.com`;

interface RiotApiOptions {
  apiKey: string;
  region: RiotRegion;
}

async function riotFetch<T>(url: string, apiKey: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "X-Riot-Token": apiKey,
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getAccountByRiotId(
  gameName: string,
  tagLine: string,
  opts: RiotApiOptions
): Promise<RiotAccountData | null> {
  const routing = REGION_TO_ROUTING[opts.region];
  const url = `${RIOT_ROUTING_BASE(routing)}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  return riotFetch<RiotAccountData>(url, opts.apiKey);
}

export async function getSummonerByPuuid(
  puuid: string,
  opts: RiotApiOptions
): Promise<RiotSummonerData | null> {
  const url = `${RIOT_API_BASE(opts.region)}/lol/summoner/v4/summoners/by-puuid/${puuid}`;
  return riotFetch<RiotSummonerData>(url, opts.apiKey);
}

export async function getRankedEntries(
  puuid: string,
  opts: RiotApiOptions
): Promise<RiotRankedEntry[]> {
  const url = `${RIOT_API_BASE(opts.region)}/lol/league/v4/entries/by-puuid/${puuid}`;
  const data = await riotFetch<RiotRankedEntry[]>(url, opts.apiKey);
  return data ?? [];
}

export async function fetchPlayerData(
  gameName: string,
  tagLine: string,
  opts: RiotApiOptions
): Promise<Partial<QueuePlayer> | null> {
  const account = await getAccountByRiotId(gameName, tagLine, opts);
  if (!account) return null;

  const summoner = await getSummonerByPuuid(account.puuid, opts);
  if (!summoner) return null;

  const entries = await getRankedEntries(account.puuid, opts);

  const soloQ = entries.find((e) => e.queueType === "RANKED_SOLO_5x5");
  const flexQ = entries.find((e) => e.queueType === "RANKED_FLEX_SR");

  const bestQ = soloQ ?? flexQ;

  const wins = bestQ?.wins ?? 0;
  const losses = bestQ?.losses ?? 0;
  const totalGames = wins + losses;

  return {
    profileIconId: summoner.profileIconId,
    summonerLevel: summoner.summonerLevel,
    rankedTier: bestQ?.tier ?? "UNRANKED",
    rankedDivision: bestQ?.rank ?? "IV",
    leaguePoints: bestQ?.leaguePoints ?? 0,
    wins,
    losses,
    winRate: totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0,
  };
}

export function parseRiotId(input: string): {
  gameName: string;
  tagLine: string;
} | null {
  const trimmed = input.trim();
  const hashIndex = trimmed.indexOf("#");
  if (hashIndex === -1) return null;

  const gameName = trimmed.substring(0, hashIndex).trim();
  const tagLine = trimmed.substring(hashIndex + 1).trim();

  if (!gameName || !tagLine) return null;
  return { gameName, tagLine };
}
