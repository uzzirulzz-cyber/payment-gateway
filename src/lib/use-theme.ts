"use client";

import { useEffect, useState, useCallback } from "react";

export interface ThemeConfig {
  preset: string;
  name: string;
  logoUrl: string;
  bgImageUrl: string | null;
  backgroundColor: string;
  surfaceColor: string;
  primaryColor: string;
  accentFrom: string;
  accentTo: string;
  isDark: boolean;
}

/** Hardcoded fallback used while the network request is in flight. */
export const FALLBACK_THEME: ThemeConfig = {
  preset: "default",
  name: "PlayBeat Default",
  logoUrl: "/playbeat-logo.png",
  bgImageUrl: "/playbeat-bg.jpg",
  backgroundColor: "#000000",
  surfaceColor: "#0a0a0a",
  primaryColor: "#FFFFFF",
  accentFrom: "#0099FF",
  accentTo: "#0066CC",
  isDark: true,
};

/**
 * Loads the active theme from /api/theme, applies CSS variables to
 * <html>, and exposes a restore() function.
 */
export function useTheme() {
  const [theme, setTheme] = useState<ThemeConfig>(FALLBACK_THEME);
  const [loading, setLoading] = useState(true);

  const applyTheme = useCallback((t: ThemeConfig) => {
    setTheme(t);
    const root = document.documentElement;
    root.style.setProperty("--bg", t.backgroundColor);
    root.style.setProperty("--surface", t.surfaceColor);
    root.style.setProperty("--fg", t.primaryColor);
    root.style.setProperty("--accent-from", t.accentFrom);
    root.style.setProperty("--accent-to", t.accentTo);
    if (t.isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/theme");
      const json = await res.json();
      if (json.ok && json.data) {
        applyTheme(json.data as ThemeConfig);
      }
    } catch {
      /* keep fallback */
    } finally {
      setLoading(false);
    }
  }, [applyTheme]);

  const restore = useCallback(async () => {
    try {
      const res = await fetch("/api/theme/restore", { method: "POST" });
      const json = await res.json();
      if (json.ok && json.data) {
        applyTheme(json.data as ThemeConfig);
      }
      return json;
    } catch {
      return { ok: false };
    }
  }, [applyTheme]);

  useEffect(() => {
    load();
  }, [load]);

  return { theme, loading, reload: load, restore };
}
