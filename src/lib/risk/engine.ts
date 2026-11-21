import { CALCULATORS, levelFor } from "./rules";
import type { Assessment, DayScore, Forecast, PetProfile, ThreatAssessment, ThreatId } from "./types";
import { mean } from "./util";
import { describeWeek } from "./weekWords";

/** Which threats apply. Lungworm (A. vasorum) is a dog parasite, so cats don't see it. */
export function threatsFor(profile: PetProfile | null): ThreatId[] {
  return profile?.species === "cat"
    ? ["fleas", "ticks", "harvestMites"]
    : ["fleas", "ticks", "lungworm", "harvestMites"];
}

/**
 * Scores each of the next 7 days for each threat, using the 7 days of weather before it.
 * Runs entirely on the device: the pet's details never reach a server.
 */
export function assess(forecast: Forecast, profile: PetProfile | null): Assessment {
  const { days, todayIndex } = forecast;
  const first = Math.max(todayIndex, 6);
  const last = Math.min(days.length - 1, todayIndex + 6);
  if (last < first) throw new Error("Not enough weather data to score a week.");

  const threats: ThreatAssessment[] = threatsFor(profile).map((threat) => {
    const calc = CALCULATORS[threat];
    const scored: DayScore[] = [];
    for (let i = first; i <= last; i++) {
      const { score, factors } = calc(days, i, profile);
      scored.push({ date: days[i].date, score, level: levelFor(score), factors });
    }
    const weekScore = Math.round(mean(scored.map((d) => d.score)));
    let peakIndex = 0;
    scored.forEach((d, i) => {
      if (d.score > scored[peakIndex].score) peakIndex = i;
    });
    return { threat, days: scored, week: { score: weekScore, level: levelFor(weekScore), peakIndex } };
  });

  const daily = threats[0].days.map((_, i) => {
    let top = threats[0];
    for (const t of threats) if (t.days[i].score > top.days[i].score) top = t;
    return { date: top.days[i].date, score: top.days[i].score, level: top.days[i].level, topThreat: top.threat };
  });

  const topWeek = threats.reduce((a, b) => (b.week.score > a.week.score ? b : a));

  return {
    // Never "high": there is no local case data behind these numbers.
    confidence: profile ? "medium" : "low",
    threats,
    daily,
    overall: { score: topWeek.week.score, level: topWeek.week.level, topThreat: topWeek.threat },
    weather: describeWeek(days.slice(first, last + 1)),
  };
}
