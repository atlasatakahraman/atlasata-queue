import { NextRequest } from "next/server";
import { resolveRiotIdentity } from "@/lib/riot/client";
import type { RiotRegion } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/riot/resolve
 * Resolve a Riot ID to PUUID + encrypted summoner ID.
 * Body: { gameName, tagLine, region }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameName, tagLine, region } = body as {
      gameName: string;
      tagLine: string;
      region: RiotRegion;
    };

    if (!gameName || !tagLine || !region) {
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

    const result = await resolveRiotIdentity(gameName, tagLine, region);

    if (!result) {
      return Response.json(
        { error: "Oyuncu bulunamadı" },
        { status: 404 },
      );
    }

    return Response.json({
      gameName: result.gameName,
      tagLine: result.tagLine,
      puuid: result.puuid,
      encryptedSummonerId: result.encryptedSummonerId,
      profileIconId: result.profileIconId,
    });
  } catch (error) {
    console.error(`[API /resolve] Error:`, error);
    return Response.json(
      { error: "Riot API hatası" },
      { status: 500 },
    );
  }
}
