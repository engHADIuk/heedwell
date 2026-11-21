"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useSampleWeek } from "@/lib/client/useSampleWeek";
import { THREATS } from "@/lib/copy";
import { explain } from "@/lib/risk/rules";
import { weekdayName } from "@/lib/risk/util";
import { DemoButton } from "../DemoButton";
import { LevelBadge, ThreatIcon } from "../ui";
import { WeekRibbon } from "../WeekRibbon";

export function ExampleWeek() {
  const week = useSampleWeek();
  const [selected, setSelected] = useState(0);

  if (!week) {
    return <div className="example__loading skeleton" aria-hidden="true" />;
  }
  const { assessment, ahead } = week;
  const day = assessment.daily[selected];
  const name = selected === 0 ? "Today" : weekdayName(day.date);
  const sorted = [...assessment.threats].sort((a, b) => b.days[selected].score - a.days[selected].score);

  return (
    <div className="example">
      <WeekRibbon assessment={assessment} weather={ahead} selected={selected} onSelect={setSelected} />
      <p className="example__caption" aria-live="polite">
        <strong>{name}.</strong> The overall level is <LevelBadge level={day.level} /> because of {THREATS[day.topThreat].name.toLowerCase()}.
      </p>
      <ul className="example__grid" aria-label={`Example scores for ${name}`}>
        {sorted.map((t) => {
          const d = t.days[selected];
          return (
            <li key={t.threat} className="example__item glass">
              <div className="example__top">
                <span className="threat__icon">
                  <ThreatIcon threat={t.threat} />
                </span>
                <h3>{THREATS[t.threat].name}</h3>
                <span className="example__score">{d.score}</span>
              </div>
              <div className={`meter lv-${d.level}`} style={{ "--fill": `${Math.max(3, d.score)}%` } as React.CSSProperties} aria-hidden="true">
                <span />
              </div>
              <p className="example__reason">{explain(d.factors, d.level)}</p>
            </li>
          );
        })}
      </ul>
      <p className="example__note">
        Sample weather for Hook, Hampshire, for a dog called Biscuit who walks in parks, woodland and fields. The scores come from the same rules as the live plan.
      </p>
      <div className="example__actions">
        <DemoButton className="btn btn-primary">
          Open the full example
          <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
        </DemoButton>
        <Link href="/pet" className="btn btn-ghost">
          Plan for my own pet
        </Link>
      </div>
    </div>
  );
}
