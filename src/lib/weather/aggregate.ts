import type { DayWeather } from "@/lib/risk/types";

export interface HourlyPayload {
  time: string[];
  temperature_2m: (number | null)[];
  relative_humidity_2m: (number | null)[];
  precipitation: (number | null)[];
  soil_moisture_0_to_7cm?: (number | null)[];
}

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/**
 * Turns hourly readings into one row per day. Times are already in UK local time, so the date is
 * simply the first ten characters. Days with fewer than 12 temperature readings are dropped.
 */
export function aggregateDaily(h: HourlyPayload): DayWeather[] {
  const buckets = new Map<string, { t: number[]; rh: number[]; p: number[]; sm: number[] }>();
  h.time.forEach((time, i) => {
    const date = time.slice(0, 10);
    let b = buckets.get(date);
    if (!b) buckets.set(date, (b = { t: [], rh: [], p: [], sm: [] }));
    const t = h.temperature_2m[i];
    const rh = h.relative_humidity_2m[i];
    const p = h.precipitation[i];
    const sm = h.soil_moisture_0_to_7cm?.[i];
    if (isNum(t)) b.t.push(t);
    if (isNum(rh)) b.rh.push(rh);
    if (isNum(p)) b.p.push(p);
    if (isNum(sm)) b.sm.push(sm);
  });

  return [...buckets.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .filter(([, b]) => b.t.length >= 12 && b.rh.length >= 12)
    .map(([date, b]) => ({
      date,
      tempMean: Math.round(avg(b.t) * 10) / 10,
      tempMax: Math.round(Math.max(...b.t) * 10) / 10,
      tempMin: Math.round(Math.min(...b.t) * 10) / 10,
      humidityMean: Math.round(avg(b.rh)),
      precipSum: Math.round(b.p.reduce((a, c) => a + c, 0) * 10) / 10,
      soilMoisture: b.sm.length >= 12 ? Math.round(avg(b.sm) * 1000) / 1000 : null,
    }));
}

/** Today's date in the UK, as YYYY-MM-DD. */
export function todayInLondon(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
