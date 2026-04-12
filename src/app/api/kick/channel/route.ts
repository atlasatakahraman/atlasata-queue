import { NextRequest } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { logger } from "@/lib/utils";

const execAsync = promisify(exec);

/**
 * GET /api/kick/channel?slug=channelName
 *
 * Resolves the Kick chatroom ID and live status.
 * Uses curl to bypass Cloudflare's TLS fingerprinting.
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");

  if (!slug) {
    return Response.json({ error: "Kanal adı gerekli" }, { status: 400 });
  }

  try {
    const data = await fetchChannelViaCurl(slug);

    if (data) {
      const chatroomId = data.chatroom?.id ?? null;
      const isLive = data.livestream !== null && data.livestream !== undefined;
      const streamTitle = data.livestream?.session_title ?? null;

      logger.log(
        `[Kick Channel] Resolved ${slug}: chatroom=${chatroomId}, live=${isLive}`
      );

      return Response.json({
        chatroomId,
        slug: data.slug ?? slug,
        isLive,
        streamTitle,
      });
    }

    logger.warn(`[Kick Channel] Could not resolve chatroom for ${slug}`);
    return Response.json({ error: "Kanal bulunamadı" }, { status: 404 });
  } catch (err) {
    logger.error("[Kick Channel API Error]", err);
    return Response.json({ error: "Kick API hatası" }, { status: 500 });
  }
}

/**
 * Use curl to fetch channel data from Kick's v2 API.
 * Node.js fetch is blocked by Cloudflare TLS fingerprinting,
 * but curl works because it uses OpenSSL.
 */
async function fetchChannelViaCurl(
  slug: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any | null> {
  try {
    const safeSlug = slug.replace(/[^a-zA-Z0-9_-]/g, "");
    const { stdout } = await execAsync(
      `curl -s -H "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36" -H "Accept: application/json" "https://kick.com/api/v2/channels/${safeSlug}"`,
      { timeout: 10000 }
    );

    return JSON.parse(stdout);
  } catch (err) {
    logger.warn(`[Kick Channel] curl failed for ${slug}:`, err);
    return null;
  }
}
