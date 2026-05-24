"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { AppSettings, RiotRegion } from "@/types";
import { REGION_TO_ROUTING } from "@/types";
import { DEFAULT_SETTINGS } from "@/lib/constants";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("atlas-settings");
        if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch { }
    return DEFAULT_SETTINGS;
  });
  const [isLoading, setIsLoading] = useState(true);
  const isInitialMount = useRef(true);

  // Mark loading complete after first render (client-side hydration)
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Save to localStorage whenever settings change (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    try {
      localStorage.setItem("atlas-settings", JSON.stringify(settings));
    } catch { }
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      if (updates.riotRegion) {
        next.riotRoutingRegion = REGION_TO_ROUTING[updates.riotRegion];
      }
      return next;
    });
  }, []);

  const setRegion = useCallback((region: RiotRegion) => {
    setSettings((prev) => ({
      ...prev,
      riotRegion: region,
      riotRoutingRegion: REGION_TO_ROUTING[region],
    }));
  }, []);

  const isConfigured = Boolean(
    settings.riotApiKey && settings.kickChannelName
  );

  return {
    settings,
    updateSettings,
    setRegion,
    isConfigured,
    isLoading,
  };
}
