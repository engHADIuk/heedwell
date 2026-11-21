import { CalendarCheck, Droplets, Gauge, Thermometer, TrendingUp } from "lucide-react";
import { LEVELS, THREATS } from "@/lib/copy";
import type { Assessment, DayWeather } from "@/lib/risk/types";
import { dayMonthLabel, weekdayName } from "@/lib/risk/util";
import { LevelBadge } from "./ui";

/** Five quick facts about the week, worked out from the same numbers as everything else on the page. */
export function PlanGlance({ assessment, weather }: { assessment: Assessment; weather: DayWeather[] }) {
  const daily = assessment.daily;
  let hi = 0;
  let lo = 0;
  daily.forEach((d, i) => {
    if (d.score > daily[hi].score) hi = i;
    if (d.score < daily[lo].score) lo = i;
  });
  const dayName = (i: number) => (i === 0 ? "Today" : weekdayName(daily[i].date));
  const rain = weather.reduce((a, d) => a + d.precipSum, 0);
  const wet = weather.filter((d) => d.precipSum >= 1).length;
  const coldest = Math.round(Math.min(...weather.map((d) => d.tempMin)));
  const warmest = Math.round(Math.max(...weather.map((d) => d.tempMax)));
  const flat = daily[hi].score === daily[lo].score;

  return (
    <section className="glance-tiles" aria-label="The week at a glance">
      <div className="gtile glass">
        <span className="gtile__icon">
          <Gauge size={20} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <p className="gtile__label">The week overall</p>
        <p className="gtile__value">
          <LevelBadge level={assessment.overall.level} />
        </p>
        <p className="gtile__note">Mostly {THREATS[assessment.overall.topThreat].name.toLowerCase()}</p>
      </div>
      <div className="gtile glass">
        <span className="gtile__icon">
          <TrendingUp size={20} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <p className="gtile__label">Highest day</p>
        <p className="gtile__value">{flat ? "Steady all week" : dayName(hi)}</p>
        <p className="gtile__note">
          {flat ? `${daily[hi].score} out of 100 every day` : `${daily[hi].score} out of 100, ${LEVELS[daily[hi].level].label.toLowerCase()}`}
        </p>
      </div>
      <div className="gtile glass">
        <span className="gtile__icon">
          <CalendarCheck size={20} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <p className="gtile__label">Calmest day</p>
        <p className="gtile__value">{flat ? "Steady all week" : dayName(lo)}</p>
        <p className="gtile__note">{flat ? "No day stands out" : `${daily[lo].score} out of 100, ${dayMonthLabel(daily[lo].date)}`}</p>
      </div>
      <div className="gtile glass">
        <span className="gtile__icon">
          <Droplets size={20} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <p className="gtile__label">Rain this week</p>
        <p className="gtile__value">{rain < 0.5 ? "Dry" : `${Math.round(rain)} mm`}</p>
        <p className="gtile__note">{wet === 0 ? "No wet days" : `${wet} wet ${wet === 1 ? "day" : "days"} of 7`}</p>
      </div>
      <div className="gtile glass">
        <span className="gtile__icon">
          <Thermometer size={20} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <p className="gtile__label">Temperatures</p>
        <p className="gtile__value">
          {coldest}° to {warmest}°
        </p>
        <p className="gtile__note">Lowest and highest</p>
      </div>
    </section>
  );
}
