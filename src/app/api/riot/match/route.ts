import { NextRequest } from "next/server";
import { getMatchDetail } from "@/lib/riot/client";
import type { RiotRegion } from "@/types";
import type { MatchResult, MatchTeamSummary, RiotMatchParticipant } from "@/lib/riot/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/riot/match
 * Get detailed match result for a specific match.
 * Body: { matchId, puuid, region }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId, puuid, region } = body as {
      matchId: string;
      puuid: string;
      region: RiotRegion;
    };

    if (!matchId || !region) {
      return Response.json(
        { error: "Eksik parametreler" },
        { status: 400 },
      );
    }

    if (!process.env.RIOT_API_KEY) {
      return Response.json(
        { error: "Riot API yapılandırılmamış" },
        { status: 500 },
      );
    }

    const data = await getMatchDetail(matchId, region);

    if (!data) {
      return Response.json(
        { error: "Maç bulunamadı" },
        { status: 404 },
      );
    }

    const trackedPlayer = data.info.participants.find(
      (p) => p.puuid === puuid,
    ) || data.info.participants[0];

    if (!trackedPlayer) {
      return Response.json(
        { error: "Oyuncu bu maçta bulunamadı" },
        { status: 404 },
      );
    }

    // Group participants by teamId directly to avoid missing players due to incomplete teams array
    const teamsMap = new Map<number, RiotMatchParticipant[]>();
    for (const p of data.info.participants) {
      const list = teamsMap.get(p.teamId) || [];
      list.push(p);
      teamsMap.set(p.teamId, list);
    }

    const teams: MatchTeamSummary[] = Array.from(teamsMap.entries()).map(([teamId, players]) => {
      // Find win status from teams array if present, otherwise default to first player's win status
      const teamWinObj = data.info.teams.find((t) => t.teamId === teamId);
      const win = teamWinObj ? teamWinObj.win : (players[0]?.win ?? false);

      return {
        teamId,
        win,
        players: players.map((p) => {
          const gameName = p.riotIdGameName || (p as any).riotIdGameName || p.summonerName || "Bilinmiyor";
          const tagLine = p.riotIdTagline || (p as any).riotIdTagLine || "";
          return {
            summonerName: gameName,
            riotIdGameName: gameName,
            riotIdTagline: tagLine,
            championName: p.championName,
            championId: p.championId,
            kills: p.kills,
            deaths: p.deaths,
            assists: p.assists,
            teamId: p.teamId,
            damageDealt: p.totalDamageDealtToChampions,
            healingDone: p.totalHeal,
            damageTaken: p.totalDamageTaken,
            win: p.win,
          };
        }),
      };
    });

    const result: MatchResult = {
      matchId: data.metadata.matchId,
      gameId: data.info.gameId,
      gameDuration: data.info.gameDuration,
      gameMode: data.info.gameMode,
      gameStartTimestamp: data.info.gameStartTimestamp,
      gameEndTimestamp: data.info.gameEndTimestamp,
      queueId: data.info.queueId,
      win: trackedPlayer.win,
      teamId: trackedPlayer.teamId,
      championId: trackedPlayer.championId,
      championName: trackedPlayer.championName,
      kills: trackedPlayer.kills,
      deaths: trackedPlayer.deaths,
      assists: trackedPlayer.assists,
      cs: trackedPlayer.totalMinionsKilled + trackedPlayer.neutralMinionsKilled,
      visionScore: trackedPlayer.visionScore,
      goldEarned: trackedPlayer.goldEarned,
      damageDealt: trackedPlayer.totalDamageDealtToChampions,
      healingDone: trackedPlayer.totalHeal,
      damageTaken: trackedPlayer.totalDamageTaken,
      teams,
      savedAt: new Date().toISOString(),
    };

    return Response.json({ match: result });
  } catch {
    return Response.json(
      { error: "Match detail API hatası" },
      { status: 500 },
    );
  }
}
