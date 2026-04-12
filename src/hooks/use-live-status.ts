"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { logger } from "@/lib/utils";

interface LiveStatus {
  isLive: boolean;
  streamTitle: string | null;
  lastChecked: Date | null;
}

interface UseLiveStatusOptions {
  channelSlug: string;
  pollInterval?: number; // ms, default 120000 (120s)
  enabled: boolean;
  onStreamEnd?: () => void;
}

export function useLiveStatus({
  channelSlug,
  pollInterval = 120000,
  enabled,
  onStreamEnd,
}: UseLiveStatusOptions) {
  const [status, setStatus] = useState<LiveStatus>({
    isLive: false,
    streamTitle: null,
    lastChecked: null,
  });

  const wasLiveRef = useRef(false);
  const onStreamEndRef = useRef(onStreamEnd);
  onStreamEndRef.current = onStreamEnd;

  const checkLiveStatus = useCallback(async () => {
    if (!channelSlug) return;

    try {
      // Direct browser fetch to Kick V2
      const res = await fetch(`https://kick.com/api/v2/channels/${channelSlug}`, {
        headers: {
          "Accept": "application/json",
        },
      });
      
      if (!res.ok) return;

      const data = await res.json();
      
      // Kick V2 API uses data.livestream being non-null to indicate live status
      const isLive = !!data.livestream;
      const streamTitle = data.livestream?.session_title ?? null;

      setStatus({
        isLive,
        streamTitle,
        lastChecked: new Date(),
      });

      if (wasLiveRef.current && !isLive) {
        logger.log("[Live Status] Stream ended — clearing session");
        onStreamEndRef.current?.();
      }

      wasLiveRef.current = isLive;
    } catch (err) {
      // Silently fail, it might be a temporary network issue or CORS
    }
  }, [channelSlug]);

  useEffect(() => {
    if (!enabled || !channelSlug) return;

    checkLiveStatus();

    const interval = setInterval(checkLiveStatus, pollInterval);

    return () => clearInterval(interval);
  }, [channelSlug, pollInterval, enabled, checkLiveStatus]);

  return status;
}
