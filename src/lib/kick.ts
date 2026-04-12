/**
 * Kick.com chat WebSocket utilities.
 *
 * Kick uses Pusher protocol for chat. We connect to their public WebSocket
 * and subscribe to the chatroom channel to receive messages.
 */

import { KICK_WS_URL } from "./constants";
import { logger } from "./utils";

export interface KickChatEvent {
  id: string;
  chatroom_id: number;
  content: string;
  type: string;
  sender: {
    id: number;
    username: string;
    slug: string;
    identity: {
      color: string;
      badges: Array<{ type: string; text: string }>;
    };
  };
  created_at: string;
}

export type KickChatHandler = (event: KickChatEvent) => void;

export async function getKickChatroomId(
  channelSlug: string,
  accessToken?: string
): Promise<number | null> {
  try {
    const params = new URLSearchParams({ slug: channelSlug });
    if (accessToken) params.set("token", accessToken);
    const res = await fetch(`/api/kick/channel?${params.toString()}`);
    
    if (res.ok) {
      const data = await res.json();
      if (data.chatroomId) return data.chatroomId;
    }

    // Fallback: If API fails (likely 403 on Vercel), try client-side scraper
    logger.log("[Kick Chat] API resolution failed or returned no ID, triggering client-side scraper...");
    return await scrapeKickChatroomId(channelSlug);
  } catch (err) {
    logger.error("[Kick Chat] Error resolving chatroom ID:", err);
    return null;
  }
}

/**
 * Scrapes the chatroom ID from the Kick channel page using a CORS proxy.
 * This is a high-reliability fallback for when the API is blocked.
 */
export async function scrapeKickChatroomId(slug: string): Promise<number | null> {
  const proxies = [
    (s: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(`https://kick.com/${s}`)}`,
    (s: string) => `https://corsproxy.io/?${encodeURIComponent(`https://kick.com/${s}`)}`,
    (s: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://kick.com/${s}`)}`
  ];

  for (const getProxyUrl of proxies) {
    try {
      const url = getProxyUrl(slug);
      logger.log(`[Kick Chat] [Scraper] Trying proxy: ${url}`);
      
      const res = await fetch(url);
      if (!res.ok) continue;
      
      const responseData = await res.json();
      // allorigins puts content in 'contents', others might return the raw HTML string
      const html = typeof responseData === 'string' ? responseData : (responseData.contents || responseData.data);
      
      if (!html || typeof html !== 'string') continue;

      const match = html.match(/\"chatroom_id\":(\d+)/) || html.match(/\"chatroom\":\{\"id\":(\d+)/);
      
      if (match && match[1]) {
        const id = parseInt(match[1]);
        logger.log(`[Kick Chat] [Scraper] Successfully found ID: ${id}`);
        return id;
      }
    } catch (err) {
      logger.warn(`[Kick Chat] [Scraper] Proxy attempt failed:`, err);
    }
  }

  logger.error("[Kick Chat] [Scraper] All proxies failed to resolve chatroom ID.");
  return null;
}

export function connectToKickChat(
  chatroomId: number,
  onMessage: KickChatHandler,
  onStatusChange?: (connected: boolean) => void
): () => void {
  let ws: WebSocket | null = null;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  let destroyed = false;

  function connect() {
    if (destroyed) return;

    ws = new WebSocket(KICK_WS_URL);

    ws.onopen = () => {
      onStatusChange?.(true);

      const subscribePayload = JSON.stringify({
        event: "pusher:subscribe",
        data: {
          auth: "",
          channel: `chatrooms.${chatroomId}.v2`,
        },
      });
      ws?.send(subscribePayload);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Log basic info for EVERY event to find the right one
        if (data.event !== "pusher:ping" && data.event !== "pusher:pong") {
          logger.log("[Kick WS Raw Event]", data.event, data);
        }

        if (data.event === "pusher:ping") {
          ws?.send(JSON.stringify({ event: "pusher:pong", data: {} }));
          return;
        }

        if (
          data.event === "App\\Events\\ChatMessageEvent" ||
          data.event === "ChatMessageEvent" ||
          data.event === "App\\Events\\ChatMessageSentEvent" ||
          data.event === "App\\Events\\MessageSent" ||
          data.event === "MessageSent"
        ) {
          const chatData = typeof data.data === 'string'
            ? JSON.parse(data.data) as KickChatEvent
            : data.data as KickChatEvent;
          
          logger.log("[Kick Chat Message Detected]", chatData.sender?.username, chatData.content);
          onMessage(chatData);
        }
      } catch (err) {
        logger.warn("[Kick WS] Parse error:", err);
      }
    };

    ws.onclose = () => {
      onStatusChange?.(false);
      if (!destroyed) {
        reconnectTimeout = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => {
      ws?.close();
    };
  }

  connect();

  return () => {
    destroyed = true;
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    ws?.close();
    onStatusChange?.(false);
  };
}
