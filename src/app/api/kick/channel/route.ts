import { NextRequest } from "next/server";
import { logger } from "@/lib/utils";

/**
 * GET /api/kick/channel?slug=channelName
 * 
 * Resolves the Kick chatroom ID and live status.
 * Uses standard fetch with optimized headers to bypass basic Cloudflare checks
 * on Vercel environments.
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");

  if (!slug) {
    return Response.json({ error: "Kanal adı gerekli" }, { status: 400 });
  }

  try {
    // Try v1 API first as it's often more stable on serverless environments
    let data = await fetchChannelData(slug, "v1");

    // If v1 fails, try v2
    if (!data) {
      data = await fetchChannelData(slug, "v2");
    }

    if (data) {
      const chatroomId = data.chatroom?.id ?? data.id ?? null;
      const isLive = data.livestream !== null && data.livestream !== undefined;
      const streamTitle = data.livestream?.session_title ?? data.livestream?.title ?? null;
      const actualSlug = data.slug ?? slug;

      logger.log(
        `[Kick Channel] Resolved ${slug}: chatroom=${chatroomId}, live=${isLive}`
      );

      return Response.json({
        chatroomId,
        slug: actualSlug,
        isLive,
        streamTitle,
      });
    }

    logger.warn(`[Kick Channel] Could not resolve chatroom for ${slug} after trying multiple APIs`);
    return Response.json({ error: "Kanal bulunamadı veya koruma engeline takıldı" }, { status: 404 });
  } catch (err) {
    logger.error("[Kick Channel API Error]", err);
    return Response.json({ error: "Kick API hatası" }, { status: 500 });
  }
}

async function fetchChannelData(slug: string, version: "v1" | "v2") {
  const safeSlug = slug.replace(/[^a-zA-Z0-9_-]/g, "");
  const url = `https://kick.com/api/${version}/channels/${safeSlug}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      },
      next: { revalidate: 60 } // Cache for 1 minute on Vercel
    });

    if (!res.ok) {
      if (res.status === 403 || res.status === 429) {
        logger.warn(`[Kick Channel] ${version} API blocked (CF/RateLimit) for ${slug}`);
      }
      return null;
    }

    return await res.json();
  } catch (err) {
    logger.warn(`[Kick Channel] ${version} fetch failed for ${slug}:`, err);
    return null;
  }
}
