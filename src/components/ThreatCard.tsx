"use client";

import { ChevronDown, CircleHelp } from "lucide-react";
import { LEVELS, THREATS } from "@/lib/copy";
import { explain } from "@/lib/risk/rules";
import type { PetProfile, ThreatAssessment } from "@/lib/risk/types";
import { weekdayName } from "@/lib/risk/util";
import { LevelBadge, Sparkline, ThreatIcon } from "./ui";

export function ThreatCard({
  threat,
  selected,
  updated,
  profile,
  onWhy,
}: {
  threat: ThreatAssessment;
  selected: number;
  updated: string;
  profile: PetProfile | null;
  onWhy: () => void;
}) {
  const meta = THREATS[threat.threat];
  const day = threat.days[selected];
  const peak = threat.days[threat.week.peakIndex];
  const name = profile?.name ?? "your pet";
  const scores = threat.days.map((d) => d.score);
  const dates = threat.days.map((d) => d.date);

  return (
    <article
      className="threat glass"
      data-threat={threat.threat}
      aria-label={`${meta.name}, ${LEVELS[day.level].label.toLowerCase()} risk, ${day.score} out of 100. Updated ${updated}.`}
    >
      <header className="threat__head">
        <span className="threat__icon">
          <ThreatIcon threat={threat.threat} />
        </span>
        <div>
          <h3 className="threat__name">{meta.name}</h3>
          <p className="threat__applies">{profile ? meta.appliesTo : `${meta.appliesTo} (pick your pet for a closer fit)`}</p>
        </div>
        <LevelBadge level={day.level} className="threat__badge" />
      </header>

      <div className="threat__score" aria-hidden="true">
        <span className="threat__num">{day.score}</span>
        <span className="threat__of">out of 100</span>
      </div>
      <div className={`meter lv-${day.level}`} style={{ "--fill": `${Math.max(3, day.score)}%` } as React.CSSProperties} aria-hidden="true">
        <span />
      </div>

      <p className="threat__reason">{explain(day.factors, day.level)}</p>

      <div className="threat__trend">
        <Sparkline values={scores} selected={selected} dates={dates} />
        <p className="threat__peak">
          {threat.days.length > 1 && peak.score > threat.days[0].score
            ? `Peaks on ${weekdayName(peak.date)} at ${peak.score}.`
            : `Highest today at ${peak.score}.`}
        </p>
        <p className="sr-only">
          Scores for the next {scores.length} days:{" "}
          {threat.days.map((d) => `${weekdayName(d.date)} ${d.score}`).join(", ")}.
        </p>
      </div>

      <div className="threat__actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onWhy}>
          <CircleHelp size={18} strokeWidth={1.5} aria-hidden="true" />
          Why this score
        </button>
      </div>

      <details className="threat__todo">
        <summary>
          What to do this week
          <ChevronDown size={18} strokeWidth={1.5} aria-hidden="true" />
        </summary>
        <ul>
          {meta.todo.map((t) => (
            <li key={t}>{t.replaceAll("{name}", name)}</li>
          ))}
        </ul>
      </details>
    </article>
  );
}
