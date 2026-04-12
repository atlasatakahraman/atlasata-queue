import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils";

/**
 * GET /api/kick/channel?slug=channelName
 * 
 * Saf HTML üzerinden Chatroom ID çözümleyici.
 * Vercel'in Kick sayfa gövdesine erişip erişemediğini test eder.
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Slug gerekli" }, { status: 400 });
  }

  try {
    // Doğrudan kanal sayfasını (HTML) çekmeyi dene
    const res = await fetch(`https://kick.com/${slug}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html",
        "Cache-Control": "no-cache"
      },
      next: { revalidate: 60 }
    });

    if (!res.ok) {
      logger.error(`[Kick API Test] Fetch başarısız: ${res.status} ${res.statusText}`);
      return NextResponse.json({ error: "Sayfa çekilemedi" }, { status: res.status });
    }

    const html = await res.text();
    
    // HTML body içinden Chatroom ID ayıkla
    const match = html.match(/\"chatroom_id\":(\d+)/) || html.match(/\"chatroom\":\{\"id\":(\d+)/);
    
    if (match && match[1]) {
      const chatroomId = parseInt(match[1]);
      logger.log(`[Kick API Test] Body içinden ID bulundu: ${chatroomId}`);
      
      return NextResponse.json({
        chatroomId,
        slug
      });
    }

    logger.error(`[Kick API Test] Sayfa gövdesinde ID bulunamadı.`);
    return NextResponse.json({ error: "ID bulunamadı" }, { status: 404 });
  } catch (error) {
    logger.error(`[Kick API Test] Hata:`, error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
