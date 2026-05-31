import { NextRequest } from "next/server";
import { getActiveGame } from "@/lib/riot/client";
import type { RiotRegion } from "@/types";
import type { ActiveGameSnapshot } from "@/lib/riot/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/riot/active-game
 * Check if a player is currently in a live game via Spectator API.
 * Tries Spectator-v5 (PUUID) first, then falls back to Spectator-v4 (encryptedSummonerId).
 *
 * Body: { puuid, encryptedSummonerId, region }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { puuid, encryptedSummonerId, region } = body as {
      puuid: string;
      encryptedSummonerId?: string;
      region: RiotRegion;
    };

    console.log(`[API /active-game] Received payload:`, {
      puuid: !!puuid,
      encryptedSummonerId: !!encryptedSummonerId,
      region: !!region,
      rawEncryptedSummonerId: encryptedSummonerId
    });

    if (!puuid || !region) {
      return Response.json(
        { error: "Eksik parametreler", detail: { puuid: !!puuid, region: !!region } },
        { status: 400 },
      );
    }

    if (!process.env.RIOT_API_KEY) {
      return Response.json(
        { error: "Riot API yapılandırılmamış" },
        { status: 500 },
      );
    }

    const { data: spectatorData, debug } = await getActiveGame(
      puuid,
      encryptedSummonerId || "",
      region,
    );

    if (!spectatorData) {
      return Response.json({
        inGame: false,
        game: null,
        debug,
      });
    }

    const snapshot: ActiveGameSnapshot = {
      gameId: spectatorData.gameId,
      gameStartTime: spectatorData.gameStartTime,
      gameMode: spectatorData.gameMode,
      gameType: spectatorData.gameType,
      mapId: spectatorData.mapId,
      gameLength: spectatorData.gameLength,
      participants: spectatorData.participants.map((p) => ({
        summonerName: p.summonerName,
        championId: p.championId,
        teamId: p.teamId,
        spell1Id: p.spell1Id,
        spell2Id: p.spell2Id,
      })),
      lastSyncAt: new Date().toISOString(),
    };

    return Response.json({
      inGame: true,
      game: snapshot,
      debug,
    });
  } catch (err) {
    return Response.json(
      { error: "Spectator API hatası", detail: String(err) },
      { status: 500 },
    );
  }
}
