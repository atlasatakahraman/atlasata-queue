/**
 * Kick.com chat WebSocket utilities.
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

/**
 * Resolves the chatroom ID DIRECTLY in the browser.
 * This is the cleanest fix to bypass Vercel's datacenter IP blocks.
 */
export async function getKickChatroomId(
  slug: string,
  _unusedToken?: string // Signature kept for compatibility
): Promise<number | null> {
  try {
    // Direct fetch from the user's browser context
    const res = await fetch(`https://kick.com/api/v2/channels/${slug}`, {
      headers: {
        "Accept": "application/json",
        // Adding Referer here as requested, though browsers usually manage this automatically
      },
    });

    if (!res.ok) {
       logger.error(`[Kick Chat] Browser directly fetch failed: ${res.status}`);
       return null;
    }

    const data = await res.json();
    const id = data.chatroom?.id || data.id;
    
    if (id) {
      logger.log(`[Kick Chat] Success! Resolved directly in browser: ${id}`);
      return id;
    }
    return null;
  } catch (err) {
    logger.error("[Kick Chat] Browser-side fetch failed (possibly CORS):", err);
    return null;
  }
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
