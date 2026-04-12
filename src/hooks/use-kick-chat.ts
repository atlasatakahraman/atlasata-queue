"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { connectToKickChat, getKickChatroomId } from "@/lib/kick";
import type { KickChatEvent } from "@/lib/kick";
import { parseRiotId } from "@/lib/riot";
import { toast } from "sonner";
import { logger } from "@/lib/utils";

interface UseKickChatOptions {
  channelSlug: string;
  accessToken?: string;
  onQueueCommand: (
    kickUsername: string,
    gameName: string,
    tagLine: string
  ) => void;
  onDuplicateAttempt: (kickUsername: string, riotId: string) => void;
  isDuplicate: (gameName: string, tagLine: string) => boolean;
  enabled: boolean;
  queueCommand: string;
  afkCommand: string;
  onAfkCommand: (kickUsername: string) => void;
  disableRiotApi?: boolean;
  initialChatroomId?: number | null;
}

export function useKickChat({
  channelSlug,
  accessToken,
  onQueueCommand,
  onDuplicateAttempt,
  isDuplicate,
  enabled,
  queueCommand,
  afkCommand,
  onAfkCommand,
  disableRiotApi,
  initialChatroomId = null,
}: UseKickChatOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [chatroomId, setChatroomId] = useState<number | null>(initialChatroomId);
  const cleanupRef = useRef<(() => void) | null>(null);

  const onQueueCommandRef = useRef(onQueueCommand);
  const onDuplicateAttemptRef = useRef(onDuplicateAttempt);
  const isDuplicateRef = useRef(isDuplicate);
  const queueCommandRef = useRef(queueCommand);
  const afkCommandRef = useRef(afkCommand);
  const onAfkCommandRef = useRef(onAfkCommand);
  const disableRiotApiRef = useRef(disableRiotApi);

  onQueueCommandRef.current = onQueueCommand;
  onDuplicateAttemptRef.current = onDuplicateAttempt;
  isDuplicateRef.current = isDuplicate;
  queueCommandRef.current = queueCommand;
  afkCommandRef.current = afkCommand;
  onAfkCommandRef.current = onAfkCommand;
  disableRiotApiRef.current = disableRiotApi;

  useEffect(() => {
    if (!channelSlug || !enabled) {
      setChatroomId(null);
      return;
    }

    if (initialChatroomId) {
      setChatroomId(initialChatroomId);
      return;
    }

    let cancelled = false;
    getKickChatroomId(channelSlug, accessToken).then((id) => {
      if (!cancelled) {
        setChatroomId(id);
        if (id) {
          logger.log(`[Kick Chat] Chatroom resolved: ${id} for ${channelSlug}`);
          toast.success("Kick Sohbet", {
            description: `${channelSlug} kanalına bağlanıyor...`,
          });
        } else {
          logger.warn(`[Kick Chat] Could not resolve chatroom for ${channelSlug}`);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [channelSlug, accessToken, enabled]);

  const handleMessage = useCallback(
    (event: KickChatEvent) => {
      const content = event.content.trim();
      if (!content) return;

      const qCommand = queueCommandRef.current.toLowerCase();
      const aCommand = afkCommandRef.current.toLowerCase();

      if (aCommand && content.toLowerCase() === aCommand) {
        onAfkCommandRef.current(event.sender.username);
        return;
      }

      if (!content.toLowerCase().startsWith(qCommand)) return;

      if (disableRiotApiRef.current) {
        if (isDuplicateRef.current(event.sender.username, "KICK")) {
          onDuplicateAttemptRef.current(event.sender.username, event.sender.username);
          return;
        }
        onQueueCommandRef.current(event.sender.username, event.sender.username, "KICK");
        return;
      }

      const argument = content.substring(qCommand.length).trim();

      if (!argument) return;

      const parsed = parseRiotId(argument);
      if (!parsed) return;

      const { gameName, tagLine } = parsed;

      if (isDuplicateRef.current(gameName, tagLine)) {
        onDuplicateAttemptRef.current(
          event.sender.username,
          `${gameName}#${tagLine}`
        );
        return;
      }

      onQueueCommandRef.current(event.sender.username, gameName, tagLine);
    },
    []
  );

  useEffect(() => {
    if (!chatroomId || !enabled) {
      cleanupRef.current?.();
      cleanupRef.current = null;
      setIsConnected(false);
      return;
    }

    logger.log(`[Kick Chat] Connecting to chatroom ${chatroomId}...`);

    cleanupRef.current = connectToKickChat(
      chatroomId,
      handleMessage,
      (connected) => {
        setIsConnected(connected);
        if (connected) {
          logger.log(`[Kick Chat] Connected to chatroom ${chatroomId}`);
        }
      }
    );

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [chatroomId, enabled, handleMessage]);

  const reconnect = useCallback(() => {
    cleanupRef.current?.();
    if (chatroomId && enabled) {
      cleanupRef.current = connectToKickChat(
        chatroomId,
        handleMessage,
        setIsConnected
      );
      toast.info("Sohbet bağlantısı yenileniyor…");
    }
  }, [chatroomId, enabled, handleMessage]);

  return {
    isConnected,
    chatroomId,
    reconnect,
  };
}
