import { NextRequest } from "next/server";
import { getMatchList } from "@/lib/riot/client";
import type { RiotRegion } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/riot/matches
 * Get recent match IDs for a player.
 * Body: { puuid, region, count? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { puuid, region, count = 5 } = body as {
      puuid: string;
      region: RiotRegion;
      count?: number;
    };

    if (!puuid || !region) {
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

    const matchIds = await getMatchList(puuid, region, Math.min(count, 10));

    return Response.json({ matchIds });
  } catch {
    return Response.json(
      { error: "Match list API hatası" },
      { status: 500 },
    );
  }
}
