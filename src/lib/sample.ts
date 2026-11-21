import { DEMO_PROFILE } from "@/lib/profile";
import { assess } from "@/lib/risk/engine";
import type { Assessment, DayWeather, Forecast } from "@/lib/risk/types";
import { todayInLondon } from "@/lib/weather/aggregate";

/**
 * An example week for the home page: a mild, damp spell in Hampshire. The weather numbers
 * are SAMPLE values, written by hand. The scores are worked out by the real risk engine,
 * so tapping through the example shows exactly what the live plan would do with that weather.
 */
const RAIN_DAYS = new Set([-6, -5, -2, 3, 4, 6]);

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function sampleForecast(today: string = todayInLondon()): Forecast {
  const days: DayWeather[] = [];
  for (let i = -7; i <= 6; i++) {
    const mean = 8.5 + 1.8 * Math.sin(i / 3) + (i >= 3 ? 1.8 : 0);
    const wet = RAIN_DAYS.has(i);
    days.push({
      date: addDays(today, i),
      tempMean: Math.round(mean * 10) / 10,
      tempMax: Math.round((mean + 3.2) * 10) / 10,
      tempMin: Math.round((mean - 3.2) * 10) / 10,
      humidityMean: Math.round(79 + (i >= 3 ? 8 : 0) + 3 * Math.cos(i)),
      precipSum: wet ? 4 : 0,
      soilMoisture: wet ? 0.36 : 0.33,
    });
  }
  return {
    place: { postcode: "RG27 9XA", outcode: "RG27", label: "Hook, Hampshire", latitude: 51.2879, longitude: -0.9632 },
    days,
    todayIndex: 7,
    fetchedAt: new Date().toISOString(),
    source: "Open-Meteo",
  };
}

export interface SampleWeek {
  forecast: Forecast;
  assessment: Assessment;
  /** Today and the six days after it. */
  ahead: DayWeather[];
}

export function sampleWeek(today?: string): SampleWeek {
  const forecast = sampleForecast(today);
  return { forecast, assessment: assess(forecast, DEMO_PROFILE), ahead: forecast.days.slice(forecast.todayIndex) };
}
