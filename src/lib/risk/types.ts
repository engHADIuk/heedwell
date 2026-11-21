export type Species = "dog" | "cat";
export type AgeBand = "under1" | "1to3" | "4to7" | "8plus";
export type Terrain = "garden" | "parks" | "woodland" | "fields" | "beach" | "swimming";
export type Habit = "eatsGrass" | "eatsSlugs" | "hunts" | "travelledAbroad";
export type Household = "children" | "otherPets" | "immunocompromised";
/** "other" means the owner described the age in their own words (see ageNote). */
export type Age = AgeBand | "other";
export type Symptom =
  | "cough"
  | "itching"
  | "tired"
  | "appetite"
  | "stomach"
  | "weight"
  | "skin"
  | "bleeding"
  | "breathing"
  | "collapse";

export interface PetProfile {
  name: string;
  species: Species;
  age: Age;
  terrains: Terrain[];
  habits: Habit[];
  household: Household[];
  /**
   * Things the owner told us in their own words. None of these change a score: they are
   * kept on the device and printed on the vet summary so the vet sees them.
   */
  ageNote?: string;
  terrainNote?: string;
  habitNote?: string;
  householdNote?: string;
  symptoms?: Symptom[];
  concerns?: string;
}

export type ThreatId = "fleas" | "ticks" | "lungworm" | "harvestMites";
export type Level = "low" | "moderate" | "high" | "veryHigh";
export type Confidence = "low" | "medium";

/** One day of weather, already reduced from hourly readings. Dates are YYYY-MM-DD in UK time. */
export interface DayWeather {
  date: string;
  tempMean: number;
  tempMax: number;
  tempMin: number;
  humidityMean: number;
  precipSum: number;
  soilMoisture: number | null;
}

export interface Place {
  /** Full postcode, or just the outward code when only that was given. */
  postcode: string;
  outcode: string;
  /** Plain label, for example "Hook, Hampshire". */
  label: string;
  latitude: number;
  longitude: number;
}

/** What the forecast API returns: 7 past days, today and the days ahead. */
export interface Forecast {
  place: Place;
  days: DayWeather[];
  todayIndex: number;
  fetchedAt: string;
  source: "Open-Meteo";
}

export type FactorEffect = "raises" | "lowers" | "neutral";

/** One reason behind a score, written so an owner can read it. */
export interface Factor {
  id: string;
  label: string;
  /** The numbers behind the factor, in plain words. */
  detail: string;
  /** One sentence that can stand alone as the "why". */
  reason: string;
  /** 0 to 1. How strongly this factor is pushing the score up. */
  strength: number;
  effect: FactorEffect;
  sourceIds: string[];
}

export interface DayScore {
  date: string;
  score: number;
  level: Level;
  factors: Factor[];
}

export interface ThreatAssessment {
  threat: ThreatId;
  days: DayScore[];
  week: { score: number; level: Level; peakIndex: number };
}

export interface Assessment {
  confidence: Confidence;
  threats: ThreatAssessment[];
  /** Highest score across threats, for each day. */
  daily: { date: string; score: number; level: Level; topThreat: ThreatId }[];
  overall: { score: number; level: Level; topThreat: ThreatId };
  weather: { phrase: string };
}
