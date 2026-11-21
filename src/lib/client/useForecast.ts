"use client";

import { useCallback, useEffect, useState } from "react";
import type { Forecast } from "@/lib/risk/types";
import { loadForecast, saveForecast } from "./store";

export type ForecastErrorCode =
  | "postcode_invalid"
  | "postcode_not_found"
  | "postcode_service_unavailable"
  | "weather_unavailable"
  | "offline";

export type ForecastState =
  | { status: "loading" }
  | { status: "ready"; forecast: Forecast }
  | { status: "error"; code: ForecastErrorCode; message: string; lastGood: Forecast | null };

const LOADING: ForecastState = { status: "loading" };

/** Loads the weather for a postcode. On failure, hands back the last good update if there is one. */
export function useForecast(postcode: string | null) {
  const [attempt, setAttempt] = useState(0);
  const key = `${postcode}#${attempt}`;
  const [result, setResult] = useState<{ key: string; state: ForecastState } | null>(null);

  useEffect(() => {
    if (!postcode) return;
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/forecast?postcode=${encodeURIComponent(postcode)}`, { signal: ctrl.signal });
        const body = await res.json();
        if (!res.ok) throw Object.assign(new Error(body.message), { code: body.code });
        saveForecast(body as Forecast);
        setResult({ key, state: { status: "ready", forecast: body as Forecast } });
      } catch (e) {
        if (ctrl.signal.aborted) return;
        const code = (e as { code?: ForecastErrorCode }).code;
        const offline = !code;
        setResult({
          key,
          state: {
            status: "error",
            code: code ?? "offline",
            message: offline ? "You're offline." : (e as Error).message,
            lastGood: code === "postcode_invalid" || code === "postcode_not_found" ? null : loadForecast(postcode),
          },
        });
      }
    })();
    return () => ctrl.abort();
  }, [postcode, key]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const state = postcode && result?.key === key ? result.state : LOADING;
  return { state, retry };
}
