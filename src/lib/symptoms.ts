import type { PetProfile, Symptom } from "@/lib/risk/types";

/**
 * What an owner can tick under "Have you noticed anything?". Heedwell never uses these to
 * diagnose. They go on the vet summary, and the urgent ones trigger a "call your vet now" message.
 */
export const SYMPTOMS: { id: Symptom; label: string; urgent?: boolean }[] = [
  { id: "cough", label: "Coughing" },
  { id: "itching", label: "Itching or scratching" },
  { id: "tired", label: "Unusually tired" },
  { id: "appetite", label: "Eating or drinking less" },
  { id: "stomach", label: "Vomiting or loose stools" },
  { id: "weight", label: "Losing weight" },
  { id: "skin", label: "Lumps, scabs or skin changes" },
  { id: "bleeding", label: "Bleeding or unusual bruising", urgent: true },
  { id: "breathing", label: "Struggling to breathe", urgent: true },
  { id: "collapse", label: "Collapse, fits or very weak", urgent: true },
];

export const SYMPTOM_LABEL = Object.fromEntries(SYMPTOMS.map((s) => [s.id, s.label])) as Record<Symptom, string>;
const URGENT = new Set<Symptom>(SYMPTOMS.filter((s) => s.urgent).map((s) => s.id));

/** Words in the free text that should never wait for an online plan. A false alarm is fine here. */
const URGENT_WORDS = /\b(breath\w*|gasp\w*|collaps\w*|seiz\w*|fit|fits|fitting|bleed\w*|blood\w*|poison\w*|unconscious|unresponsive|choking|swollen face)\b/i;

export function hasUrgentSigns(profile: Pick<PetProfile, "symptoms" | "concerns"> | null | undefined): boolean {
  if (!profile) return false;
  if ((profile.symptoms ?? []).some((s) => URGENT.has(s))) return true;
  return URGENT_WORDS.test(profile.concerns ?? "");
}

export const URGENT_MESSAGE =
  "If your pet is struggling to breathe, has collapsed or had a fit, or is bleeding, call your vet or an emergency vet now. Don't wait for an online plan.";

export function hasNotes(profile: PetProfile | null | undefined): boolean {
  if (!profile) return false;
  return Boolean(
    profile.ageNote ||
      profile.terrainNote ||
      profile.habitNote ||
      profile.householdNote ||
      profile.concerns ||
      (profile.symptoms && profile.symptoms.length),
  );
}
