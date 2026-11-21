import type { PhotoKey } from "@/lib/photos";
import type { Age, AgeBand, Confidence, Habit, Household, Level, Species, Terrain, ThreatId } from "@/lib/risk/types";

export const BRAND = {
  name: "Heedwell",
  tagline: "Your pet's week, planned.",
  disclaimer: "Independent concept. Not veterinary advice. Talk to your vet.",
};

export const LEVELS: Record<Level, { label: string; adjective: string }> = {
  low: { label: "Low", adjective: "quiet" },
  moderate: { label: "Moderate", adjective: "moderate" },
  high: { label: "High", adjective: "high-risk" },
  veryHigh: { label: "Very high", adjective: "very high-risk" },
};

export const CONFIDENCE: Record<Confidence, { label: string; text: string }> = {
  medium: {
    label: "Medium confidence",
    text: "Medium confidence. Based on weather and published guidance, not on cases near you.",
  },
  low: {
    label: "Low confidence",
    text: "Low confidence. Add details about your pet for a closer fit. Based on weather and published guidance, not on cases near you.",
  },
};

export const THREATS: Record<
  ThreatId,
  { name: string; blurb: string; appliesTo: string; todo: string[]; askVet: string }
> = {
  fleas: {
    name: "Fleas",
    blurb: "Tiny jumping insects that live on pets and in warm homes.",
    appliesTo: "Dogs and cats",
    todo: [
      "Check your pet's coat regularly, especially around the neck and the base of the tail.",
      "Remember bedding and soft furnishings: most of a flea problem lives in the home, not on the pet.",
      "UK guidance leans towards protection all year. Ask your vet what suits your pet.",
    ],
    askVet: "Which flea protection do you recommend for {name}, and how often should we use it through winter?",
  },
  ticks: {
    name: "Ticks",
    blurb: "Small blood-feeding arachnids that wait in long grass and woodland.",
    appliesTo: "Dogs and cats",
    todo: [
      "After woodland or long-grass walks, check legs, ears, armpits and chest with your fingertips.",
      "Remove any tick you find with a tick-removal tool, and note the date.",
      "Ask your vet about tick protection if {name} walks in woodland or on fields.",
    ],
    askVet: "What tick protection suits {name}, given the places we walk?",
  },
  lungworm: {
    name: "Lungworm",
    blurb: "A parasite dogs can catch from slugs, snails and the slime they leave behind.",
    appliesTo: "Dogs",
    todo: [
      "Keep an eye on whether your dog eats slugs, snails or slimy grass, and steer them away where you can.",
      "Ask your vet about lungworm protection, especially if your dog eats slugs, snails or grass.",
    ],
    askVet: "Does {name} need lungworm protection, and is it common in our area?",
  },
  harvestMites: {
    name: "Harvest mites",
    blurb: "Tiny orange mites in long grass that make skin very itchy.",
    appliesTo: "Dogs and cats",
    todo: [
      "After walks in long grass, check feet, ears and tummy for tiny orange dots.",
      "In peak season, stick to short grass or paths in the warmest, driest part of the day.",
      "If your pet is itchy, don't use human creams. Ask your vet.",
    ],
    askVet: "{name} gets itchy after walks in late summer. Could it be harvest mites, and what can we do?",
  },
};

export const AGES: { id: AgeBand; label: string; blurb: string }[] = [
  { id: "under1", label: "Under 1 year", blurb: "Puppy or kitten" },
  { id: "1to3", label: "1 to 3 years", blurb: "Young adult" },
  { id: "4to7", label: "4 to 7 years", blurb: "Adult" },
  { id: "8plus", label: "8 years or more", blurb: "Senior" },
];

export const AGE_LABEL: Record<AgeBand, string> = Object.fromEntries(AGES.map((a) => [a.id, a.label])) as Record<
  AgeBand,
  string
>;

/** The age as it should read on screen and on the vet summary. */
export function ageLabel(p: { age: Age; ageNote?: string }): string {
  return p.age === "other" ? (p.ageNote ?? "Age not given") : AGE_LABEL[p.age];
}

export const TERRAINS: { id: Terrain; label: string; photo: PhotoKey }[] = [
  { id: "garden", label: "Garden", photo: "garden" },
  { id: "parks", label: "Parks", photo: "golden-run" },
  { id: "woodland", label: "Woodland", photo: "forest-path" },
  { id: "fields", label: "Fields", photo: "field-dog" },
  { id: "beach", label: "Beach", photo: "beach" },
  { id: "swimming", label: "Swimming", photo: "lake" },
];

export const TERRAIN_LABEL = Object.fromEntries(TERRAINS.map((t) => [t.id, t.label])) as Record<Terrain, string>;

export const HABITS: { id: Habit; label: string; blurb: string; only?: Species }[] = [
  { id: "eatsGrass", label: "Eats grass", blurb: "Grazes on grass on walks or in the garden.", only: "dog" },
  { id: "eatsSlugs", label: "Eats slugs or snails", blurb: "Has been seen eating them, or licking slime.", only: "dog" },
  { id: "hunts", label: "Hunts or rummages", blurb: "Spends time in long grass and undergrowth." },
  { id: "travelledAbroad", label: "Has travelled abroad", blurb: "Been outside the UK in the past year." },
];

export const HABIT_LABEL = Object.fromEntries(HABITS.map((h) => [h.id, h.label])) as Record<Habit, string>;

export const HOUSEHOLD: { id: Household; label: string; blurb: string }[] = [
  { id: "children", label: "Young children", blurb: "Under 5 in the home." },
  { id: "otherPets", label: "Other pets", blurb: "Dogs, cats or other animals." },
  { id: "immunocompromised", label: "Someone with a weakened immune system", blurb: "Anyone who may be more vulnerable to infection." },
];

export const HOUSEHOLD_LABEL = Object.fromEntries(HOUSEHOLD.map((h) => [h.id, h.label])) as Record<Household, string>;

/** The legal supply categories in the UK register, in plain English. */
export const CATEGORIES: Record<string, { short: string; long: string }> = {
  "POM-V": { short: "Prescription from your vet", long: "Only a vet can prescribe it." },
  "POM-VPS": { short: "Prescription from a vet, pharmacist or qualified person", long: "Needs a prescription from a vet, pharmacist or other qualified person." },
  "NFA-VPS": { short: "No prescription, from a vet, pharmacist or qualified person", long: "Sold without a prescription, but only by a vet, pharmacist or qualified person." },
  "AVM-GSL": { short: "General sale", long: "Can be sold by any shop." },
};

export const SPECIES_LABEL: Record<Species, string> = { dog: "Dogs", cat: "Cats" };

export const LINKS = [
  { href: "/plan", label: "Plan" },
  { href: "/medicines", label: "Medicines" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
] as const;

export const WHAT_WE_DONT_KNOW = [
  "How many cases of each parasite have been seen near you. Heedwell uses weather and published guidance, not local case counts.",
  "Whether your walks are damper, shadier or warmer than the area average.",
  "What protection your pet already has. Your vet knows that, and can adjust everything here.",
  "Your pet's own health. Heedwell never replaces a vet's advice.",
];
