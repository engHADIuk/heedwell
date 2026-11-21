import { sanitiseProfile } from "@/lib/profile";
import type { PetProfile } from "@/lib/risk/types";
import { parsePostcode } from "@/lib/weather/postcode";

export interface SharePayload {
  v: 1;
  /** Only the outward half of the postcode is shared, so the link doesn't point at a street. */
  outcode: string;
  profile: PetProfile;
}

const MAX_LENGTH = 3000;

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): string {
  const b64 = text.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function encodeShare(payload: SharePayload): string {
  return toBase64Url(JSON.stringify(payload));
}

/** Reads a share link value. Anything odd returns null; nothing in it is trusted. */
export function decodeShare(value: string | null | undefined): SharePayload | null {
  if (!value || value.length > MAX_LENGTH) return null;
  try {
    const raw = JSON.parse(fromBase64Url(value)) as Record<string, unknown>;
    if (raw?.v !== 1 || typeof raw.outcode !== "string") return null;
    const parsed = parsePostcode(raw.outcode);
    const profile = sanitiseProfile(raw.profile);
    if (!parsed || !profile) return null;
    return { v: 1, outcode: parsed.outcode, profile };
  } catch {
    return null;
  }
}
