import type { DayWeather, Forecast, PetProfile } from "@/lib/risk/types";

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

type DayFn = Partial<DayWeather> | ((i: number) => Partial<DayWeather>);

/** `n` days starting at `start`, each filled from `fill`. */
export function makeDays(start: string, n: number, fill: DayFn): DayWeather[] {
  return Array.from({ length: n }, (_, i) => {
    const o = typeof fill === "function" ? fill(i) : fill;
    const tempMean = o.tempMean ?? 10;
    return {
      date: addDays(start, i),
      tempMean,
      tempMax: o.tempMax ?? tempMean + 4,
      tempMin: o.tempMin ?? tempMean - 4,
      humidityMean: o.humidityMean ?? 75,
      precipSum: o.precipSum ?? 0,
      soilMoisture: o.soilMoisture === undefined ? null : o.soilMoisture,
    };
  });
}

/** 14 days: 7 before `today`, `today`, then 6 ahead. */
export function forecastAround(today: string, fill: DayFn): Forecast {
  return {
    place: { postcode: "RG27 9XA", outcode: "RG27", label: "Hook, Hampshire", latitude: 51.28, longitude: -0.96 },
    days: makeDays(addDays(today, -7), 14, fill),
    todayIndex: 7,
    fetchedAt: "2026-01-01T12:00:00.000Z",
    source: "Open-Meteo",
  };
}

export const woodlandDog: PetProfile = {
  name: "Biscuit",
  species: "dog",
  age: "1to3",
  terrains: ["woodland", "fields", "parks"],
  habits: ["eatsGrass"],
  household: [],
};

export const indoorCat: PetProfile = {
  name: "Miso",
  species: "cat",
  age: "4to7",
  terrains: [],
  habits: [],
  household: [],
};
