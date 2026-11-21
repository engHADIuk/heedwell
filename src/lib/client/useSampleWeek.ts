import { useSyncExternalStore } from "react";
import { sampleWeek, type SampleWeek } from "@/lib/sample";

let cached: SampleWeek | null = null;
const subscribe = () => () => {};

/**
 * The example week, built in the browser so its dates are today's. On the server it is null,
 * so the page prerenders without a stale date.
 */
export function useSampleWeek(): SampleWeek | null {
  return useSyncExternalStore(
    subscribe,
    () => (cached ??= sampleWeek()),
    () => null,
  );
}
