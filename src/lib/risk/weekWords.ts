import type { DayWeather } from "./types";
import { weekdayName } from "./util";

const tempWord = (t: number) => (t < 3 ? "cold" : t < 8 ? "cool" : t < 14 ? "mild" : t < 20 ? "warm" : "hot");
const wetWord = (d: DayWeather) =>
  d.precipSum >= 5 ? "wet" : d.precipSum >= 1 || d.humidityMean >= 82 ? "damp" : "dry";

export const describeDay = (d: DayWeather) => `${tempWord(d.tempMean)} and ${wetWord(d)}`;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function mode(items: string[]): string {
  const counts = new Map<string, number>();
  for (const i of items) counts.set(i, (counts.get(i) ?? 0) + 1);
  let best = items[0];
  for (const [k, v] of counts) if (v > (counts.get(best) ?? 0)) best = k;
  return best;
}

/**
 * One short sentence about the week's weather, for example "Mild and damp from Wednesday."
 * `days` is today first, then the days ahead.
 */
export function describeWeek(days: DayWeather[]): { phrase: string } {
  if (days.length === 0) return { phrase: "" };
  const words = days.map(describeDay);
  if (days.length < 4) return { phrase: `${cap(mode(words))} this week.` };
  const early = mode(words.slice(0, 3));
  const later = mode(words.slice(3));
  if (early === later) return { phrase: `${cap(later)} all week.` };
  const change = words.findIndex((w, i) => i >= 1 && w === later);
  const when = change === 1 ? "tomorrow" : weekdayName(days[change].date);
  return { phrase: `${cap(later)} from ${when}.` };
}
