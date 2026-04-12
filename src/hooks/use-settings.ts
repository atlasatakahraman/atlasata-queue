"use client";

import { useState, useCallback, useEffect } from "react";
import type { AppSettings, RiotRegion } from "@/types";
import { REGION_TO_ROUTING } from "@/types";
import { DEFAULT_SETTINGS } from "@/lib/constants";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Load from localStorage on client side mount to avoid hydration mismatch
  useEffect(() => {
    try {
      const stored = localStorage.getItem("atlas-settings");
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch { }
  }, []);

  // Save to localStorage whenever settings change
  useEffect(() => {
    // Prevent saving DEFAULT_SETTINGS over actual stored settings during initial mount
    if (settings === DEFAULT_SETTINGS) return;
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
  };
}
