import type { Age, AgeBand, Habit, Household, PetProfile, Species, Symptom, Terrain } from "@/lib/risk/types";

export const SPECIES: Species[] = ["dog", "cat"];
export const AGE_BANDS: AgeBand[] = ["under1", "1to3", "4to7", "8plus"];
export const TERRAINS: Terrain[] = ["garden", "parks", "woodland", "fields", "beach", "swimming"];
export const HABITS: Habit[] = ["eatsGrass", "eatsSlugs", "hunts", "travelledAbroad"];
export const HOUSEHOLD: Household[] = ["children", "otherPets", "immunocompromised"];
export const SYMPTOM_IDS: Symptom[] = ["cough", "itching", "tired", "appetite", "stomach", "weight", "skin", "bleeding", "breathing", "collapse"];

/** Longest free-text note we keep. Keeps share links and the QR code small. */
export const NOTE_MAX = 120;
export const CONCERNS_MAX = 280;

/** Strips control characters and angle brackets, squeezes spaces, and cuts to length. Empty becomes undefined. */
export function cleanText(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const out = value
    .replace(/[\u0000-\u001f\u007f<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
    .trim();
  return out || undefined;
}

const pick = <T extends string>(value: unknown, allowed: readonly T[]): T[] =>
  Array.isArray(value) ? allowed.filter((a) => value.includes(a)) : [];

/** Cleans untrusted input (saved data, share links) into a safe profile, or null. */
export function sanitiseProfile(input: unknown): PetProfile | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, 24) : "";
  if (!name) return null;
  if (!SPECIES.includes(o.species as Species)) return null;
  if (o.age !== "other" && !AGE_BANDS.includes(o.age as AgeBand)) return null;
  const species = o.species as Species;
  const habits = pick(o.habits, HABITS).filter((h) => species === "dog" || (h !== "eatsSlugs" && h !== "eatsGrass"));
  const profile: PetProfile = {
    name,
    species,
    age: o.age as Age,
    terrains: pick(o.terrains, TERRAINS),
    habits,
    household: pick(o.household, HOUSEHOLD),
  };
  const notes = {
    ageNote: cleanText(o.ageNote, NOTE_MAX),
    terrainNote: cleanText(o.terrainNote, NOTE_MAX),
    habitNote: cleanText(o.habitNote, NOTE_MAX),
    householdNote: cleanText(o.householdNote, NOTE_MAX),
    concerns: cleanText(o.concerns, CONCERNS_MAX),
  };
  for (const [k, v] of Object.entries(notes)) if (v) (profile as unknown as Record<string, unknown>)[k] = v;
  const symptoms = pick(o.symptoms, SYMPTOM_IDS);
  if (symptoms.length) profile.symptoms = symptoms;
  return profile;
}

export const DEMO_POSTCODE = "RG27 9XA";
export const DEMO_PROFILE: PetProfile = {
  name: "Biscuit",
  species: "dog",
  age: "1to3",
  terrains: ["parks", "woodland", "fields"],
  habits: ["eatsGrass"],
  household: [],
};
