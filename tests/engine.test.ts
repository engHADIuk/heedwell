import { describe, expect, it } from "vitest";
import { assess, threatsFor } from "@/lib/risk/engine";
import { THRESHOLDS, explain, levelFor } from "@/lib/risk/rules";
import { SOURCES } from "@/lib/risk/sources";
import type { Assessment, ThreatId } from "@/lib/risk/types";
import { describeWeek } from "@/lib/risk/weekWords";
import { forecastAround, indoorCat, makeDays, woodlandDog } from "./helpers";

const week = (a: Assessment, t: ThreatId) => a.threats.find((x) => x.threat === t)!.week;

describe("levels", () => {
  it("uses the published thresholds", () => {
    expect(THRESHOLDS).toEqual({ moderate: 30, high: 55, veryHigh: 75 });
    expect(levelFor(0)).toBe("low");
    expect(levelFor(29)).toBe("low");
    expect(levelFor(30)).toBe("moderate");
    expect(levelFor(54)).toBe("moderate");
    expect(levelFor(55)).toBe("high");
    expect(levelFor(74)).toBe("high");
    expect(levelFor(75)).toBe("veryHigh");
    expect(levelFor(100)).toBe("veryHigh");
  });
});

describe("ticks", () => {
  it("are low in a cold, damp January week", () => {
    const a = assess(forecastAround("2026-01-14", { tempMean: 2, humidityMean: 90, precipSum: 2 }), woodlandDog);
    expect(week(a, "ticks").level).toBe("low");
  });

  it("are high in a warm, damp May week for a woodland dog", () => {
    const a = assess(forecastAround("2026-05-12", { tempMean: 13, humidityMean: 88, precipSum: 3 }), woodlandDog);
    expect(week(a, "ticks").score).toBeGreaterThanOrEqual(THRESHOLDS.high);
  });

  it("score higher for a woodland dog than for an indoor cat in the same weather", () => {
    const f = forecastAround("2026-05-12", { tempMean: 13, humidityMean: 88, precipSum: 3 });
    const dog = week(assess(f, woodlandDog), "ticks").score;
    const cat = week(assess(f, indoorCat), "ticks").score;
    expect(dog).toBeGreaterThan(cat);
  });

  it("need about five days at 7 °C or above before they wake up", () => {
    // Cold for 6 days, then warm. Day 7 (today) has only one warm day behind it.
    const f = forecastAround("2026-04-20", (i) => ({ tempMean: i < 7 ? 3 : 10, humidityMean: 88 }));
    const a = assess(f, woodlandDog);
    const today = a.threats.find((t) => t.threat === "ticks")!.days[0];
    const fifth = a.threats.find((t) => t.threat === "ticks")!.days[4];
    expect(fifth.score).toBeGreaterThan(today.score);
  });
});

describe("fleas", () => {
  it("never drop below the moderate floor, because heated homes keep them going", () => {
    const a = assess(forecastAround("2026-01-14", { tempMean: -2, humidityMean: 60 }), indoorCat);
    for (const d of a.threats.find((t) => t.threat === "fleas")!.days) {
      expect(d.score).toBeGreaterThanOrEqual(THRESHOLDS.moderate);
    }
  });

  it("peak in warm, humid weather", () => {
    const warm = week(assess(forecastAround("2026-07-14", { tempMean: 20, humidityMean: 78 }), woodlandDog), "fleas");
    const cold = week(assess(forecastAround("2026-01-14", { tempMean: 3, humidityMean: 78 }), woodlandDog), "fleas");
    expect(warm.score).toBeGreaterThan(cold.score);
  });

  it("do not depend on where the pet walks", () => {
    const f = forecastAround("2026-07-14", { tempMean: 20, humidityMean: 78 });
    expect(week(assess(f, woodlandDog), "fleas").score).toBe(week(assess(f, indoorCat), "fleas").score);
  });
});

describe("harvest mites", () => {
  it("are zero outside their season", () => {
    const a = assess(forecastAround("2026-02-10", { tempMean: 8, humidityMean: 70 }), woodlandDog);
    expect(week(a, "harvestMites").score).toBe(0);
  });

  it("are high in a warm, dry August for a dog on fields", () => {
    const a = assess(
      forecastAround("2026-08-18", { tempMean: 20, tempMax: 26, humidityMean: 65, precipSum: 0 }),
      woodlandDog,
    );
    expect(week(a, "harvestMites").score).toBeGreaterThanOrEqual(THRESHOLDS.high);
  });

  it("are quieter when it is wet", () => {
    const dry = week(assess(forecastAround("2026-08-18", { tempMean: 20, precipSum: 0 }), woodlandDog), "harvestMites");
    const wet = week(assess(forecastAround("2026-08-18", { tempMean: 20, precipSum: 6 }), woodlandDog), "harvestMites");
    expect(dry.score).toBeGreaterThan(wet.score);
  });
});

describe("lungworm", () => {
  it("is a dog threat only", () => {
    expect(threatsFor(woodlandDog)).toContain("lungworm");
    expect(threatsFor(indoorCat)).not.toContain("lungworm");
    expect(assess(forecastAround("2026-10-10", { tempMean: 11 }), indoorCat).threats.map((t) => t.threat)).toEqual([
      "fleas",
      "ticks",
      "harvestMites",
    ]);
  });

  it("rises with mild, wet weather", () => {
    const wet = week(assess(forecastAround("2026-10-10", { tempMean: 11, precipSum: 5 }), woodlandDog), "lungworm");
    const dry = week(assess(forecastAround("2026-10-10", { tempMean: 11, precipSum: 0 }), woodlandDog), "lungworm");
    expect(wet.score).toBeGreaterThan(dry.score);
  });

  it("rises when the dog eats slugs or snails", () => {
    const f = forecastAround("2026-10-10", { tempMean: 11, precipSum: 5 });
    const plain = week(assess(f, { ...woodlandDog, habits: [] }), "lungworm").score;
    const slugs = week(assess(f, { ...woodlandDog, habits: ["eatsSlugs"] }), "lungworm").score;
    expect(slugs).toBeGreaterThan(plain);
  });

  it("uses soil moisture when it is available", () => {
    const dry = week(assess(forecastAround("2026-10-10", { tempMean: 11, precipSum: 5, soilMoisture: 0.2 }), woodlandDog), "lungworm");
    const soaked = week(assess(forecastAround("2026-10-10", { tempMean: 11, precipSum: 5, soilMoisture: 0.42 }), woodlandDog), "lungworm");
    expect(soaked.score).toBeGreaterThan(dry.score);
  });
});

describe("assessment", () => {
  const f = forecastAround("2026-11-21", { tempMean: 9, humidityMean: 86, precipSum: 2 });

  it("covers today and the next six days, in order", () => {
    const a = assess(f, woodlandDog);
    expect(a.daily).toHaveLength(7);
    expect(a.daily[0].date).toBe("2026-11-21");
    expect(a.daily[6].date).toBe("2026-11-27");
    for (const t of a.threats) expect(t.days).toHaveLength(7);
  });

  it("keeps every score between 0 and 100", () => {
    for (const fill of [{ tempMean: -10 }, { tempMean: 40, humidityMean: 100, precipSum: 30 }, { tempMean: 15, humidityMean: 100, precipSum: 50 }]) {
      const a = assess(forecastAround("2026-08-10", fill), { ...woodlandDog, habits: ["eatsSlugs", "eatsGrass", "hunts"] });
      for (const t of a.threats) for (const d of t.days) expect(d.score >= 0 && d.score <= 100).toBe(true);
    }
  });

  it("is deterministic", () => {
    expect(assess(f, woodlandDog)).toEqual(assess(f, woodlandDog));
  });

  it("reports the highest threat as the overall level", () => {
    const a = assess(f, woodlandDog);
    const best = Math.max(...a.threats.map((t) => t.week.score));
    expect(a.overall.score).toBe(best);
  });

  it("is low confidence without pet details and never high confidence", () => {
    expect(assess(f, null).confidence).toBe("low");
    expect(assess(f, woodlandDog).confidence).toBe("medium");
  });

  it("only cites sources that exist", () => {
    const a = assess(forecastAround("2026-08-18", { tempMean: 15, precipSum: 3, soilMoisture: 0.3 }), woodlandDog);
    for (const t of a.threats) for (const d of t.days) for (const fa of d.factors) for (const id of fa.sourceIds) expect(SOURCES[id], id).toBeDefined();
  });

  it("gives every factor a plain reason and detail", () => {
    const a = assess(f, woodlandDog);
    for (const t of a.threats) for (const fa of t.days[0].factors) {
      expect(fa.reason.length).toBeGreaterThan(10);
      expect(fa.detail.length).toBeGreaterThan(10);
      expect(fa.strength).toBeGreaterThanOrEqual(0);
      expect(fa.strength).toBeLessThanOrEqual(1);
    }
  });

  it("says no worse than moderate for a mild damp November with an ordinary dog", () => {
    const a = assess(f, woodlandDog);
    expect(a.overall.level).toBe("moderate");
  });
});

describe("explain", () => {
  it("explains a low score with something that lowers it", () => {
    const a = assess(forecastAround("2026-01-14", { tempMean: 2, humidityMean: 90 }), woodlandDog);
    const ticks = a.threats.find((t) => t.threat === "ticks")!.days[0];
    expect(explain(ticks.factors, ticks.level)).toBe("Cold weather keeps ticks mostly inactive.");
  });
});

describe("describeWeek", () => {
  it("says 'all week' when the weather doesn't change", () => {
    const days = makeDays("2026-11-21", 7, { tempMean: 10, humidityMean: 85, precipSum: 2 });
    expect(describeWeek(days).phrase).toBe("Mild and damp all week.");
  });

  it("names the day the weather turns", () => {
    // 21 Nov 2026 is a Saturday, so index 4 is Wednesday.
    const days = makeDays("2026-11-21", 7, (i) =>
      i < 4 ? { tempMean: 5, humidityMean: 65, precipSum: 0 } : { tempMean: 10, humidityMean: 88, precipSum: 2 },
    );
    expect(describeWeek(days).phrase).toBe("Mild and damp from Wednesday.");
  });
});
