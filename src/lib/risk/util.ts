import type { FactorEffect } from "./types";

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
export const mean = (xs: number[]) => (xs.length ? sum(xs) / xs.length : 0);
export const round1 = (n: number) => Math.round(n * 10) / 10;
export const round2 = (n: number) => Math.round(n * 100) / 100;

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Month number 1 to 12 from a YYYY-MM-DD string. */
export const monthOf = (date: string) => Number(date.slice(5, 7));

/** A date at midday UTC, so weekday names never slip across a time-zone line. */
const atNoon = (date: string) => new Date(`${date}T12:00:00Z`);

export function weekdayName(date: string, style: "long" | "short" = "long"): string {
  return new Intl.DateTimeFormat("en-GB", { weekday: style, timeZone: "UTC" }).format(atNoon(date));
}

export function dayMonthLabel(date: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(
    atNoon(date),
  );
}

/** A factor value of 0.6 or more pushes the score up, 0.3 or less pushes it down. */
export const effectOf = (strength: number): FactorEffect =>
  strength >= 0.6 ? "raises" : strength <= 0.3 ? "lowers" : "neutral";

export function joinWords(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
