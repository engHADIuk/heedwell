"use client";

import { useSyncExternalStore } from "react";
import { sanitiseProfile } from "@/lib/profile";
import type { Forecast, PetProfile } from "@/lib/risk/types";
import { parsePostcode } from "@/lib/weather/postcode";

/** Everything Heedwell remembers lives in this one browser. Nothing here is sent to a server. */
export interface Saved {
  postcode: string | null;
  profile: PetProfile | null;
  /** True when the owner chose to skip the pet questions. */
  skipped: boolean;
}
export interface Snapshot extends Saved {
  /** False on the server and during the first render, so pages can show a skeleton, not a flash of "empty". */
  ready: boolean;
}

const KEY = "heedwell.v1";
const WEATHER_KEY = "heedwell.weather.v1";
const SERVER: Snapshot = { ready: false, postcode: null, profile: null, skipped: false };

export function parseSaved(raw: string | null): Saved {
  try {
    const o = JSON.parse(raw ?? "null") as Record<string, unknown> | null;
    return {
      postcode: typeof o?.postcode === "string" ? (parsePostcode(o.postcode)?.value ?? null) : null,
      profile: sanitiseProfile(o?.profile),
      skipped: o?.skipped === true,
    };
  } catch {
    return { postcode: null, profile: null, skipped: false };
  }
}

let memory: string | null = null; // used if the browser blocks storage
let cachedRaw: string | null | undefined;
let cached: Snapshot = SERVER;
const listeners = new Set<() => void>();

function readRaw(): string | null {
  try {
    return localStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
}

function snapshot(): Snapshot {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cached = { ready: true, ...parseSaved(raw) };
  }
  return cached;
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useSaved(): Snapshot {
  return useSyncExternalStore(subscribe, snapshot, () => SERVER);
}

export function save(patch: Partial<Saved>) {
  const { postcode, profile, skipped } = snapshot();
  const next = JSON.stringify({ postcode, profile, skipped, ...patch });
  memory = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* storage blocked: the in-memory copy still works for this visit */
  }
  emit();
}

export function forgetEverything() {
  memory = null;
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(WEATHER_KEY);
  } catch {
    /* nothing to clear */
  }
  emit();
}

/** The last weather that loaded, so the plan still works when the weather service doesn't. */
export function saveForecast(f: Forecast) {
  try {
    localStorage.setItem(WEATHER_KEY, JSON.stringify(f));
  } catch {
    /* fine */
  }
}

export function loadForecast(postcode: string): Forecast | null {
  try {
    const f = JSON.parse(localStorage.getItem(WEATHER_KEY) ?? "null") as Forecast | null;
    return f && f.place?.postcode === parsePostcode(postcode)?.value && Array.isArray(f.days) ? f : null;
  } catch {
    return null;
  }
}
