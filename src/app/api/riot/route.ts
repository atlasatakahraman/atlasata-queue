import { NextRequest } from "next/server";
import { fetchPlayerData } from "@/lib/riot";
import type { RiotRegion } from "@/types";

/**
 * POST /api/riot
 * Server-side proxy for Riot API calls so the API key never reaches the client.
 *
 * Body: { gameName, tagLine, apiKey, region }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameName, tagLine, apiKey: clientApiKey, region } = body as {
      gameName: string;
      tagLine: string;
      apiKey?: string;
      region: RiotRegion;
    };

    const apiKey = clientApiKey || process.env.RIOT_API_KEY;

    if (!gameName || !tagLine || !apiKey || !region) {
      return Response.json(
        { error: "Eksik parametreler" },
        { status: 400 }
      );
    }

    const data = await fetchPlayerData(gameName, tagLine, {
      apiKey,
      region,
    });

    if (!data) {
      return Response.json(
        { error: "Oyuncu bulunamadı" },
        { status: 404 }
      );
    }

    return Response.json(data);
  } catch {
    return Response.json(
      { error: "Riot API hatası" },
      { status: 500 }
    );
  }
}
