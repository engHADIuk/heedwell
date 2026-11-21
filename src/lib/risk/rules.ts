/**
 * The scoring rules. Each threat turns a week of weather (plus the pet's routine) into 0 to 100.
 *
 * These are transparent heuristics, not a validated epidemiological model. Every input is
 * tied to a published source (see sources.ts) and every number is explained in METHODOLOGY.md.
 *
 * Shape of every rule:  score = 100 x 0.8 x (weather conditions, 0 to 1) x (routine multiplier)
 * Weather alone can reach 80. The pet's routine decides the last 20 points.
 */
import type { DayWeather, Factor, FactorEffect, Habit, Level, PetProfile, Terrain, ThreatId } from "./types";
import { MONTH_NAMES, clamp, effectOf, joinWords, mean, monthOf, round1, round2, sum } from "./util";

export const THRESHOLDS = { moderate: 30, high: 55, veryHigh: 75 } as const;

export function levelFor(score: number): Level {
  if (score >= THRESHOLDS.veryHigh) return "veryHigh";
  if (score >= THRESHOLDS.high) return "high";
  if (score >= THRESHOLDS.moderate) return "moderate";
  return "low";
}

const WEATHER_SCALE = 0.8;
const toScore = (conditions: number, routine: number) =>
  Math.round(clamp(100 * WEATHER_SCALE * conditions * routine, 0, 100));

export interface Calc {
  score: number;
  factors: Factor[];
}
export type Calculator = (days: DayWeather[], idx: number, profile: PetProfile | null) => Calc;

function make(
  id: string,
  label: string,
  strength: number,
  detail: string,
  reason: string,
  sourceIds: string[],
  effect?: FactorEffect,
): Factor {
  const s = round2(clamp(strength, 0, 1));
  return { id, label, detail, reason, strength: s, effect: effect ?? effectOf(s), sourceIds };
}

/** Picks the one sentence that best answers "why this score?". */
export function explain(factors: Factor[], level: Level): string {
  const raisers = factors.filter((f) => f.effect === "raises").sort((a, b) => b.strength - a.strength);
  const lowers = factors.filter((f) => f.effect === "lowers").sort((a, b) => a.strength - b.strength);
  const neutral = factors.filter((f) => f.effect === "neutral");
  const ordered = level === "low" ? [...lowers, ...neutral, ...raisers] : [...raisers, ...neutral, ...lowers];
  return ordered[0]?.reason ?? "";
}

/* ---------- Routine (exposure) ---------- */

interface ExposureRule {
  base: number;
  terrain: Partial<Record<Terrain, number>>;
  habits: Partial<Record<Habit, number>>;
  min: number;
  max: number;
}
interface Exposure {
  multiplier: number;
  assumed: boolean;
  contributors: string[];
}

const TERRAIN_WORD: Record<Terrain, string> = {
  garden: "the garden",
  parks: "parks",
  woodland: "woodland",
  fields: "fields and long grass",
  beach: "beaches",
  swimming: "swimming spots",
};
const HABIT_WORD: Record<Habit, string> = {
  eatsGrass: "eating grass",
  eatsSlugs: "eating slugs or snails",
  hunts: "hunting in undergrowth",
  travelledAbroad: "travel abroad",
};
/** Used when the owner skips the pet questions. */
const ASSUMED_TERRAINS: Terrain[] = ["garden", "parks"];

function exposureFor(profile: PetProfile | null, rule: ExposureRule): Exposure {
  const assumed = profile === null;
  const terrains = assumed ? ASSUMED_TERRAINS : profile.terrains;
  const habits = assumed ? [] : profile.habits;
  let m = rule.base;
  const contributors: string[] = [];
  for (const t of terrains) {
    const w = rule.terrain[t];
    if (w) {
      m += w;
      if (w >= 0.15) contributors.push(TERRAIN_WORD[t]);
    }
  }
  for (const h of habits) {
    const w = rule.habits[h];
    if (w) {
      m += w;
      contributors.push(HABIT_WORD[h]);
    }
  }
  return { multiplier: clamp(m, rule.min, rule.max), assumed, contributors };
}

function exposureFactor(
  id: string,
  label: string,
  ex: Exposure,
  rule: ExposureRule,
  profile: PetProfile | null,
  text: { raises: string; lowers: string; neutral: string; sources: string[] },
): Factor {
  const strength = clamp((ex.multiplier - rule.min) / (rule.max - rule.min), 0, 1);
  const effect = effectOf(strength);
  const detail = ex.assumed
    ? "No pet details yet, so Heedwell assumed an average routine of garden and park walks. Add details for a closer fit."
    : ex.contributors.length
      ? `What raises it for ${profile?.name}: ${joinWords(ex.contributors)}.`
      : `Nothing in ${profile?.name}'s routine raises it.`;
  const reason = effect === "raises" ? text.raises : effect === "lowers" ? text.lowers : text.neutral;
  return make(id, label, strength, detail, reason, text.sources, effect);
}

/* ---------- Ticks (dogs and cats) ---------- */

/** Share of peak tick activity by month, January to December. From GOV.UK's description of UK tick seasons. */
const TICK_SEASON = [0.05, 0.2, 0.45, 0.85, 1, 0.95, 0.8, 0.7, 0.6, 0.45, 0.25, 0.08];
const TICK_ROUTINE: ExposureRule = {
  base: 0.6,
  terrain: { garden: 0.1, parks: 0.2, woodland: 0.4, fields: 0.35 },
  habits: { hunts: 0.1 },
  min: 0.6,
  max: 1.25,
};

export const ticks: Calculator = (days, idx, profile) => {
  const day = days[idx];
  const week = days.slice(idx - 6, idx + 1);
  let run = 0;
  for (let i = idx; i >= 0 && run < 7; i--) {
    if (days[i].tempMean >= 7) run++;
    else break;
  }
  const warmth = clamp(run / 5, 0, 1);
  const rh = mean(week.map((d) => d.humidityMean));
  const humidity = clamp((rh - 55) / 30, 0, 1);
  const rain3 = sum(days.slice(idx - 2, idx + 1).map((d) => d.precipSum));
  const rain = clamp(rain3 / 6, 0, 1);
  const month = monthOf(day.date);
  const season = TICK_SEASON[month - 1];
  const ex = exposureFor(profile, TICK_ROUTINE);

  const conditions = warmth * (0.35 + 0.65 * humidity) * (0.25 + 0.75 * season) * (0.9 + 0.1 * rain);

  const warmthDetail =
    run >= 5
      ? `${run} days in a row at 7 °C or above. That is warm enough for ticks to be active.`
      : run === 0
        ? `Today averages ${round1(day.tempMean)} °C. Ticks are mostly inactive below about 7 °C.`
        : `${run} day${run === 1 ? "" : "s"} at 7 °C or above so far. Ticks need about 5 in a row.`;
  const seasonText =
    season >= 0.7
      ? "peak season for ticks in the UK"
      : season >= 0.4
        ? "ticks are active at this time of year"
        : "ticks are less active, though they have been recorded all year round";

  return {
    score: toScore(conditions, ex.multiplier),
    factors: [
      make(
        "ticks.warmth",
        "Warm enough to be active",
        warmth,
        warmthDetail,
        warmth >= 0.8
          ? "It's warm enough for ticks to be active."
          : warmth <= 0.3
            ? "Cold weather keeps ticks mostly inactive."
            : "It's only just warm enough for ticks to get going.",
        ["pmcTickSurveillance", "mcginleyTicks"],
      ),
      make(
        "ticks.humidity",
        "Damp air",
        humidity,
        `Humidity has averaged ${Math.round(rh)}% over the last 7 days. Ticks do best above about 80%.`,
        humidity >= 0.6
          ? "Damp air helps ticks stay active."
          : humidity <= 0.3
            ? "Dry air makes ticks shelter low down."
            : "Humidity is middling for ticks.",
        ["pmcTicksEurope", "springerTickClimate"],
      ),
      make(
        "ticks.rain",
        "Recent rain",
        rain,
        `${round1(rain3)} mm fell in the last 3 days. Ticks are more active after rain.`,
        rain >= 0.6 ? "Recent rain makes ticks more active." : "There has been little rain in the last few days.",
        ["pmcTicksEurope"],
      ),
      make(
        "ticks.season",
        "Time of year",
        season,
        `${MONTH_NAMES[month - 1]}: ${seasonText}.`,
        season >= 0.7
          ? "It's a busy time of year for ticks."
          : season <= 0.3
            ? "Ticks are less active at this time of year."
            : "Ticks are active at this time of year.",
        ["govukTicks"],
      ),
      exposureFactor("ticks.routine", "Where your pet walks", ex, TICK_ROUTINE, profile, {
        raises: "Woodland and field walks are where ticks wait.",
        lowers: "Mostly indoors or on short grass, so fewer chances to pick up ticks.",
        neutral: "Your pet's usual walks put them at a middling risk of ticks.",
        sources: ["govukTicks"],
      }),
    ],
  };
};

/* ---------- Fleas (dogs and cats) ---------- */

/** 0 to 1 for how well outdoor temperature suits fleas. Best at 18 to 25 °C. */
function fleaTemp(t: number): number {
  if (t < 8) return 0;
  if (t < 18) return (t - 8) / 10;
  if (t <= 25) return 1;
  if (t < 32) return (32 - t) / 7;
  return 0;
}

export const fleas: Calculator = (days, idx) => {
  const week = days.slice(idx - 6, idx + 1);
  const t7 = mean(week.map((d) => d.tempMean));
  const rh7 = mean(week.map((d) => d.humidityMean));
  const temp = fleaTemp(t7);
  const hum = clamp((rh7 - 50) / 20, 0, 1);
  const outdoor = temp * hum;

  return {
    // 30 is the floor: heated homes keep fleas going all year.
    score: Math.round(clamp(100 * (0.3 + 0.55 * outdoor), 0, 100)),
    factors: [
      make(
        "fleas.home",
        "Heated homes",
        0.35,
        "Central heating lets fleas live and breed indoors all year. UK guidance is to protect pets year-round.",
        "Warm homes keep fleas going all year.",
        ["vetTimesFleas", "vetHelpDirectFleas"],
        "raises",
      ),
      make(
        "fleas.temperature",
        "Outdoor warmth",
        temp,
        `Temperatures have averaged ${round1(t7)} °C over the last 7 days. Fleas do best at about 18 to 25 °C.`,
        temp >= 0.6
          ? "Warm weather helps fleas breed outdoors."
          : temp <= 0.3
            ? "Cool weather slows fleas outdoors, but not in a heated home."
            : "Outdoor warmth is middling for fleas.",
        ["vetHelpDirectFleas"],
      ),
      make(
        "fleas.humidity",
        "Humidity",
        hum,
        `Humidity has averaged ${Math.round(rh7)}%. Fleas do best at about 70 to 85%.`,
        hum >= 0.6
          ? "Damp air suits fleas."
          : hum <= 0.3
            ? "Dry air is harder on fleas."
            : "Humidity is middling for fleas.",
        ["vetHelpDirectFleas"],
      ),
    ],
  };
};

/* ---------- Harvest mites (dogs and cats) ---------- */

/** Share of peak harvest mite activity by month. PDSA says July to November; peak is late summer and early autumn. */
const MITE_SEASON = [0, 0, 0, 0, 0, 0.1, 0.5, 1, 1, 0.8, 0.35, 0];
const MITE_ROUTINE: ExposureRule = {
  base: 0.6,
  terrain: { garden: 0.1, parks: 0.2, woodland: 0.3, fields: 0.4 },
  habits: { hunts: 0.1 },
  min: 0.6,
  max: 1.25,
};

export const harvestMites: Calculator = (days, idx, profile) => {
  const day = days[idx];
  const week = days.slice(idx - 6, idx + 1);
  const month = monthOf(day.date);
  const season = MITE_SEASON[month - 1];
  const tmax = mean(week.map((d) => d.tempMax));
  const warm = clamp((tmax - 8) / 12, 0, 1);
  const rain7 = sum(week.map((d) => d.precipSum));
  const dry = 1 - clamp((rain7 - 2) / 20, 0, 1);
  const ex = exposureFor(profile, MITE_ROUTINE);

  const conditions = season * (0.4 + 0.6 * warm) * (0.6 + 0.4 * dry);

  return {
    score: toScore(conditions, ex.multiplier),
    factors: [
      make(
        "mites.season",
        "Time of year",
        season,
        season > 0
          ? `${MONTH_NAMES[month - 1]}: harvest mites are mainly a problem from July to November, peaking in late summer.`
          : `${MONTH_NAMES[month - 1]}: harvest mites are mainly a problem from July to November, so they are rarely a worry now.`,
        season >= 0.7
          ? "It's peak harvest mite season."
          : "Harvest mites are mostly a late summer and autumn problem.",
        ["pdsaHarvest", "vetlexiconHarvest"],
      ),
      make(
        "mites.warmth",
        "Warm days",
        warm,
        `Daytime highs have averaged ${round1(tmax)} °C over the last 7 days. Harvest mites are most active in warm spells.`,
        warm >= 0.6 ? "Warm days make harvest mites more active." : "Cool days keep harvest mites quieter.",
        ["scotsmanHarvest"],
      ),
      make(
        "mites.dry",
        "Dry spells",
        dry,
        `${round1(rain7)} mm of rain in the last 7 days. Harvest mites are most active in dry spells.`,
        dry >= 0.6 ? "A dry spell suits harvest mites." : "Wet weather keeps harvest mites quieter.",
        ["scotsmanHarvest"],
      ),
      exposureFactor("mites.routine", "Where your pet walks", ex, MITE_ROUTINE, profile, {
        raises: "Long grass, woodland edges and parks are where harvest mites live.",
        lowers: "Mostly indoors or on short grass, so fewer chances to meet harvest mites.",
        neutral: "Your pet's usual walks put them at a middling risk of harvest mites.",
        sources: ["pdsaHarvest", "vetlexiconHarvest", "fourPawsHarvest"],
      }),
    ],
  };
};

/* ---------- Lungworm (dogs only) ---------- */

/** Share of peak lungworm transmission by month. Highest in late summer and autumn, some risk all year. */
const LUNGWORM_SEASON = [0.6, 0.6, 0.6, 0.65, 0.7, 0.8, 0.9, 1, 1, 1, 0.9, 0.7];
const LUNGWORM_ROUTINE: ExposureRule = {
  base: 0.7,
  terrain: {},
  habits: { eatsSlugs: 0.4, eatsGrass: 0.2 },
  min: 0.7,
  max: 1.3,
};

export const lungworm: Calculator = (days, idx, profile) => {
  const day = days[idx];
  const week = days.slice(idx - 6, idx + 1);
  const t7 = mean(week.map((d) => d.tempMean));
  const rain7 = sum(week.map((d) => d.precipSum));
  const soil = week.map((d) => d.soilMoisture).filter((v): v is number => v !== null);
  const mild = clamp((t7 - 4) / 8, 0, 1);
  const rainF = clamp(rain7 / 15, 0, 1);
  const wet = soil.length ? 0.6 * rainF + 0.4 * clamp((mean(soil) - 0.25) / 0.15, 0, 1) : rainF;
  const slugs = mild * wet;
  const month = monthOf(day.date);
  const season = LUNGWORM_SEASON[month - 1];
  const ex = exposureFor(profile, LUNGWORM_ROUTINE);

  const conditions = (0.15 + 0.85 * slugs) * (0.7 + 0.3 * season);

  return {
    score: toScore(conditions, ex.multiplier),
    factors: [
      make(
        "lungworm.slugs",
        "Slug and snail weather",
        slugs,
        `${round1(t7)} °C on average and ${round1(rain7)} mm of rain over the last 7 days${soil.length ? ", with soil moisture taken into account" : ""}. Slugs and snails are most active when it is mild and damp.`,
        slugs >= 0.6
          ? "Mild and damp weather means slugs and snails are more active."
          : slugs <= 0.3
            ? "Cold or dry weather keeps slugs and snails hidden."
            : "Slugs and snails are moderately active.",
        ["paLungworm"],
      ),
      make(
        "lungworm.season",
        "Time of year",
        season,
        `${MONTH_NAMES[month - 1]}: lungworm risk is highest in late summer and autumn, with some risk all year.`,
        season >= 0.9
          ? "Late summer and autumn are the busiest time for lungworm."
          : "There is some lungworm risk all year round.",
        ["vnjLungworm", "vetTimesLungworm"],
      ),
      exposureFactor("lungworm.routine", "What your dog eats", ex, LUNGWORM_ROUTINE, profile, {
        raises: "Eating slugs, snails or grass is how dogs pick up lungworm.",
        lowers: "Your dog doesn't eat slugs, snails or grass, which lowers the chance.",
        neutral: "Eating habits have a middling effect here.",
        sources: ["paLungworm"],
      }),
    ],
  };
};

export const CALCULATORS: Record<ThreatId, Calculator> = { fleas, ticks, lungworm, harvestMites };
