"use client";

import { Droplets } from "lucide-react";
import { useRef } from "react";
import { LEVELS } from "@/lib/copy";
import type { Assessment, DayWeather } from "@/lib/risk/types";
import { dayMonthLabel, weekdayName } from "@/lib/risk/util";

/**
 * The week as seven capsules. It is both the picture of the week and the control:
 * choosing a day re-scores everything below it.
 */
export function WeekRibbon({
  assessment,
  weather,
  selected,
  onSelect,
}: {
  assessment: Assessment;
  weather: DayWeather[];
  selected: number;
  onSelect: (i: number) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const n = assessment.daily.length;

  function onKeyDown(e: React.KeyboardEvent, i: number) {
    let next = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % n;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + n) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    else return;
    e.preventDefault();
    onSelect(next);
    refs.current[next]?.focus();
  }

  return (
    <div className="ribbon glass" role="radiogroup" aria-label="Choose a day to see its scores">
      {assessment.daily.map((d, i) => {
        const w = weather.find((x) => x.date === d.date);
        const name = i === 0 ? "Today" : weekdayName(d.date, "short");
        return (
          <button
            key={d.date}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={i === selected}
            tabIndex={i === selected ? 0 : -1}
            className="ribbon__day"
            onClick={() => onSelect(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
            aria-label={`${i === 0 ? "Today" : weekdayName(d.date)}, ${dayMonthLabel(d.date)}: ${LEVELS[d.level].label.toLowerCase()} risk, ${d.score} out of 100`}
          >
            <span className="ribbon__name">
              {name}
              {i === 0 && <span className="ribbon__today" aria-hidden="true" />}
            </span>
            <span className="ribbon__date">{dayMonthLabel(d.date)}</span>
            <span className={`ribbon__cap lv-${d.level}`} style={{ "--fill": `${Math.max(10, d.score)}%` } as React.CSSProperties}>
              <span className="ribbon__fill" />
            </span>
            <span className="ribbon__score">{d.score}</span>
            {w && (
              <span className="ribbon__wx">
                <span>{Math.round(w.tempMean)}°</span>
                <span className="ribbon__rain">
                  <Droplets size={12} strokeWidth={1.75} aria-hidden="true" />
                  {w.precipSum < 0.1 ? "0" : w.precipSum.toFixed(w.precipSum < 10 ? 1 : 0)}
                </span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
