import type { Forecast, Place } from "@/lib/risk/types";
import { aggregateDaily, todayInLondon, type HourlyPayload } from "./aggregate";
import type { ParsedPostcode } from "./postcode";

export type UpstreamErrorCode = "postcode_not_found" | "postcode_service_unavailable" | "weather_unavailable";

export class UpstreamError extends Error {
  constructor(
    public code: UpstreamErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export interface UpstreamConfig {
  postcodesBase: string;
  openMeteoBase: string;
  fetchImpl: typeof fetch;
  timeoutMs: number;
}

/** Base URLs can be swapped by environment variable, which is how the tests and screenshots run offline. */
export function defaultConfig(): UpstreamConfig {
  return {
    postcodesBase: process.env.POSTCODES_API_BASE ?? "https://api.postcodes.io",
    openMeteoBase: process.env.OPEN_METEO_API_BASE ?? "https://api.open-meteo.com",
    fetchImpl: fetch,
    timeoutMs: 8000,
  };
}

const firstString = (v: unknown): string | null => {
  const x = Array.isArray(v) ? v[0] : v;
  return typeof x === "string" && x.trim() ? x.trim() : null;
};

export async function lookupPlace(parsed: ParsedPostcode, cfg: UpstreamConfig): Promise<Place> {
  const path = parsed.kind === "full" ? "postcodes" : "outcodes";
  const url = `${cfg.postcodesBase}/${path}/${encodeURIComponent(parsed.value)}`;
  let res: Response;
  try {
    res = await cfg.fetchImpl(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(cfg.timeoutMs) });
  } catch {
    throw new UpstreamError("postcode_service_unavailable", "The postcode service didn't answer.");
  }
  if (res.status === 404) throw new UpstreamError("postcode_not_found", "That postcode wasn't found.");
  if (!res.ok) throw new UpstreamError("postcode_service_unavailable", "The postcode service is unavailable.");

  const body = (await res.json().catch(() => null)) as { result?: Record<string, unknown> } | null;
  const r = body?.result;
  const lat = Number(r?.latitude);
  const lon = Number(r?.longitude);
  if (!r || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new UpstreamError("postcode_not_found", "That postcode has no known location.");
  }
  const parish = firstString(r.parish);
  const name = parish && !/unparished/i.test(parish) ? parish : (firstString(r.admin_district) ?? parsed.outcode);
  const area = firstString(r.admin_county) ?? firstString(r.region) ?? firstString(r.country);
  return {
    postcode: parsed.value,
    outcode: parsed.outcode,
    label: area && area !== name ? `${name}, ${area}` : name,
    latitude: lat,
    longitude: lon,
  };
}

export async function fetchDays(place: Place, cfg: UpstreamConfig) {
  const params = new URLSearchParams({
    latitude: place.latitude.toFixed(4),
    longitude: place.longitude.toFixed(4),
    hourly: "temperature_2m,relative_humidity_2m,precipitation,soil_moisture_0_to_7cm",
    past_days: "7",
    forecast_days: "7",
    timezone: "Europe/London",
  });
  let res: Response;
  try {
    res = await cfg.fetchImpl(`${cfg.openMeteoBase}/v1/forecast?${params}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(cfg.timeoutMs),
    });
  } catch {
    throw new UpstreamError("weather_unavailable", "The weather service didn't answer.");
  }
  if (!res.ok) throw new UpstreamError("weather_unavailable", "The weather service is unavailable.");
  const body = (await res.json().catch(() => null)) as { hourly?: HourlyPayload } | null;
  if (!body?.hourly?.time?.length) throw new UpstreamError("weather_unavailable", "The weather service sent no data.");
  const days = aggregateDaily(body.hourly);
  if (days.length < 8) throw new UpstreamError("weather_unavailable", "The weather service sent too little data.");
  return days;
}

export async function getForecast(parsed: ParsedPostcode, cfg: UpstreamConfig, now = new Date()): Promise<Forecast> {
  const place = await lookupPlace(parsed, cfg);
  const days = await fetchDays(place, cfg);
  const today = todayInLondon(now);
  const found = days.findIndex((d) => d.date === today);
  return {
    place,
    days,
    todayIndex: found >= 0 ? found : Math.min(7, days.length - 1),
    fetchedAt: now.toISOString(),
    source: "Open-Meteo",
  };
}
