"use client";

import { useEffect } from "react";
import { setTrackTransport } from "@/lib/tools/runtime";

// Forwards funnel events (visit / tool_use / export_done / promo_click) to
// Google Analytics as gtag events. No-op until GA is enabled via
// NEXT_PUBLIC_GOOGLE_ANALYTICS_ID — track() stays silent otherwise.
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export default function TrackBridge() {
  useEffect(() => {
    setTrackTransport(({ tool, step, meta }) => {
      window.gtag?.("event", step, { tool, ...meta });
    });
    return () => setTrackTransport(undefined);
  }, []);
  return null;
}
