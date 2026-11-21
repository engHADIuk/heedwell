export interface ParsedPostcode {
  kind: "full" | "outcode";
  /** Tidy form, for example "RG27 9XA" or "RG27". */
  value: string;
  /** The outward half, for example "RG27". */
  outcode: string;
}

/** Accepts a full UK postcode or just its first half. Returns null when it can't be one. */
export function parsePostcode(input: string): ParsedPostcode | null {
  const compact = input.toUpperCase().replace(/\s+/g, "");
  if (compact.length < 2 || compact.length > 7) return null;
  const full = compact.match(/^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})$/);
  if (full) return { kind: "full", value: `${full[1]} ${full[2]}`, outcode: full[1] };
  if (/^[A-Z]{1,2}\d[A-Z\d]?$/.test(compact)) return { kind: "outcode", value: compact, outcode: compact };
  return null;
}
