import type { RiotRegion, RiotRoutingRegion } from "@/types";

/** Tracked Riot account stored in localStorage */
export interface TrackedRiotAccount {
  gameName: string;
  tagLine: string;
  puuid: string;
  encryptedSummonerId: string;
  region: RiotRegion;
  routingRegion: RiotRoutingRegion;
  profileIconId?: number;
  rankedTier?: string;
  rankedDivision?: string;
  winRate?: number;
  resolvedAt: string;
}

/** Tracking session state machine */
export type TrackingState =
  | "idle"
  | "polling"
  | "in_game"
  | "ended_waiting_match"
  | "match_found"
  | "error";

/** Active game snapshot (sanitized for localStorage) */
export interface ActiveGameSnapshot {
  gameId: number;
  gameStartTime: number;
  gameMode: string;
  gameType: string;
  mapId: number;
  gameLength: number;
  participants: ActiveGameParticipant[];
  lastSyncAt: string;
}

export interface ActiveGameParticipant {
  summonerName: string;
  championId: number;
  teamId: number;
  spell1Id: number;
  spell2Id: number;
}

/** Tracking session persisted in localStorage */
export interface TrackingSession {
  state: TrackingState;
  trackedPuuid: string;
  activeGame: ActiveGameSnapshot | null;
  gameEndedAt: string | null;
  matchCheckCount: number;
  lastCheckedAt: string | null;
  error: string | null;
}

/** Finalized match result stored in history */
export interface MatchResult {
  matchId: string;
  gameId: number;
  gameDuration: number;
  gameMode: string;
  gameStartTimestamp: number;
  gameEndTimestamp: number;
  queueId: number;
  win: boolean;
  teamId: number;
  championId: number;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  visionScore: number;
  goldEarned: number;
  damageDealt?: number;
  healingDone?: number;
  damageTaken?: number;
  teams: MatchTeamSummary[];
  savedAt: string;
}

export interface MatchTeamSummary {
  teamId: number;
  win: boolean;
  players: MatchPlayerSummary[];
}

export interface MatchPlayerSummary {
  summonerName: string;
  riotIdGameName?: string;
  riotIdTagline?: string;
  championName: string;
  championId: number;
  kills: number;
  deaths: number;
  assists: number;
  teamId: number;
  damageDealt?: number;
  healingDone?: number;
  damageTaken?: number;
  win: boolean;
}

/** Riot Spectator API response shape (partial) */
export interface RiotSpectatorData {
  gameId: number;
  gameStartTime: number;
  gameMode: string;
  gameType: string;
  mapId: number;
  gameLength: number;
  participants: RiotSpectatorParticipant[];
}

export interface RiotSpectatorParticipant {
  summonerId: string;
  summonerName: string;
  championId: number;
  teamId: number;
  spell1Id: number;
  spell2Id: number;
  puuid?: string;
}

/** Riot Match-v5 response shape (partial) */
export interface RiotMatchData {
  metadata: {
    matchId: string;
    participants: string[];
  };
  info: {
    gameId: number;
    gameDuration: number;
    gameMode: string;
    gameStartTimestamp: number;
    gameEndTimestamp: number;
    queueId: number;
    participants: RiotMatchParticipant[];
    teams: RiotMatchTeam[];
  };
}

export interface RiotMatchParticipant {
  puuid: string;
  summonerName: string;
  riotIdGameName?: string;
  riotIdTagline?: string;
  championName: string;
  championId: number;
  kills: number;
  deaths: number;
  assists: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  visionScore: number;
  goldEarned: number;
  win: boolean;
  teamId: number;
  totalDamageDealtToChampions: number;
  totalHeal: number;
  totalDamageTaken: number;
}

export interface RiotMatchTeam {
  teamId: number;
  win: boolean;
}

/** API response shapes */
export interface ResolveResponse {
  gameName: string;
  tagLine: string;
  puuid: string;
  encryptedSummonerId: string;
  profileIconId: number;
}

export interface SpectatorDebugInfo {
  platform: string;
  puuid: string;
  encryptedSummonerId: string;
  v5Url: string;
  v5Status: number;
  v4Url: string | null;
  v4Status: number | null;
  usedVersion: "v5" | "v4" | "none";
}

export interface ActiveGameResponse {
  inGame: boolean;
  game: ActiveGameSnapshot | null;
  debug?: SpectatorDebugInfo;
}

export interface MatchListResponse {
  matchIds: string[];
}

export interface MatchDetailResponse {
  match: MatchResult;
}
