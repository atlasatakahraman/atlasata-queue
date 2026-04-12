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
      logger.log(`[Kick Chat] [Debug] Using provided initial chatroom ID: ${initialChatroomId}`);
      setChatroomId(initialChatroomId);
      return;
    }

    logger.log(`[Kick Chat] [Debug] No initial ID found. Attempting to resolve slug: ${channelSlug}`);
    let cancelled = false;
    getKickChatroomId(channelSlug, accessToken).then((id) => {
      if (!cancelled) {
        setChatroomId(id);
        if (id) {
          logger.log(`[Kick Chat] [Debug] Chatroom resolved via API: ${id} for ${channelSlug}`);
          toast.success("Kick Sohbet", {
            description: `${channelSlug} kanalına bağlanıyor...`,
          });
        } else {
          logger.error(`[Kick Chat] [Debug] FAILED to resolve chatroom for ${channelSlug}. Please enter ID manually in Settings.`);
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

      logger.log(`[Kick Chat] [Debug] Incoming message from ${event.sender.username}: "${content}"`);
      logger.log(`[Kick Chat] [Debug] Checking against command: "${qCommand}"`);

      if (aCommand && content.toLowerCase() === aCommand) {
        logger.log(`[Kick Chat] [Debug] AFK Command matched!`);
        onAfkCommandRef.current(event.sender.username);
        return;
      }

      // Locale-insensitive check for Turkish "ı" issue
      const normalizedContent = content.toLowerCase().replace(/ı/g, 'i');
      const normalizedCommand = qCommand.replace(/ı/g, 'i');

      if (!normalizedContent.startsWith(normalizedCommand)) {
        logger.log(`[Kick Chat] [Debug] Command prefix did not match.`);
        return;
      }

      logger.log(`[Kick Chat] [Debug] Command prefix matched. Parsing argument...`);

      if (disableRiotApiRef.current) {
        logger.log(`[Kick Chat] [Debug] Riot API disabled, adding as generic player.`);
        if (isDuplicateRef.current(event.sender.username, "KICK")) {
          onDuplicateAttemptRef.current(event.sender.username, event.sender.username);
          return;
        }
        onQueueCommandRef.current(event.sender.username, event.sender.username, "KICK");
        return;
      }

      const argument = content.substring(qCommand.length).trim();
      logger.log(`[Kick Chat] [Debug] Argument: "${argument}"`);

      if (!argument) {
        logger.warn(`[Kick Chat] [Debug] Empty argument for command.`);
        return;
      }

      const parsed = parseRiotId(argument);
      if (!parsed) {
        logger.warn(`[Kick Chat] [Debug] Failed to parse Riot ID from: "${argument}"`);
        return;
      }

      const { gameName, tagLine } = parsed;
      logger.log(`[Kick Chat] [Debug] Parsed Riot ID: ${gameName}#${tagLine}`);

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
