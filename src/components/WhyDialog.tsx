"use client";

import { ArrowDownRight, ArrowUpRight, ExternalLink, Minus, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { CONFIDENCE, THREATS, WHAT_WE_DONT_KNOW } from "@/lib/copy";
import { explain } from "@/lib/risk/rules";
import { sourcesFor } from "@/lib/risk/sources";
import type { Confidence, Factor, FactorEffect, ThreatAssessment } from "@/lib/risk/types";
import { dayMonthLabel, weekdayName } from "@/lib/risk/util";
import { LevelBadge } from "./ui";

const EFFECT: Record<FactorEffect, { text: string; Icon: typeof Minus }> = {
  raises: { text: "Raises the score", Icon: ArrowUpRight },
  lowers: { text: "Lowers the score", Icon: ArrowDownRight },
  neutral: { text: "Little effect", Icon: Minus },
};

const ORDER: Record<FactorEffect, number> = { raises: 0, neutral: 1, lowers: 2 };

function sortFactors(factors: Factor[]) {
  return [...factors].sort((a, b) => ORDER[a.effect] - ORDER[b.effect] || b.strength - a.strength);
}

/** "Why this score": every input, in plain words, with where it came from. */
export function WhyDialog({
  threat,
  selected,
  confidence,
  open,
  onClose,
}: {
  threat: ThreatAssessment | null;
  selected: number;
  confidence: Confidence;
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const day = threat?.days[selected];
  const factors = day ? sortFactors(day.factors) : [];
  const sources = sourcesFor([...new Set(factors.flatMap((f) => f.sourceIds))]);
  const when = day ? (selected === 0 ? "today" : weekdayName(day.date)) : "";

  return (
    <dialog
      ref={ref}
      className="drawer"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {threat && day && (
        <div className="drawer__body">
          <header className="drawer__head">
            <div>
              <LevelBadge level={day.level} />
              <h2 id={titleId} className="drawer__title">
                Why {THREATS[threat.threat].name.toLowerCase()} scores {day.score} {when === "today" ? "today" : `on ${when}`}
              </h2>
              <p className="drawer__sub">
                {weekdayName(day.date)} {dayMonthLabel(day.date)}. {explain(day.factors, day.level)}
              </p>
            </div>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              <X size={22} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </header>

          <section aria-labelledby={`${titleId}-f`}>
            <h3 id={`${titleId}-f`} className="drawer__h">
              What is pushing it up or down
            </h3>
            <ul className="factors">
              {factors.map((f) => {
                const { text, Icon } = EFFECT[f.effect];
                return (
                  <li key={f.id} className="factor">
                    <div className="factor__head">
                      <span className="factor__label">{f.label}</span>
                      <span className={`effect effect--${f.effect}`}>
                        <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                        {text}
                      </span>
                    </div>
                    <div className="meter meter--thin" style={{ "--fill": `${Math.max(3, f.strength * 100)}%` } as React.CSSProperties} aria-hidden="true">
                      <span />
                    </div>
                    <p className="factor__detail">{f.detail}</p>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-labelledby={`${titleId}-k`}>
            <h3 id={`${titleId}-k`} className="drawer__h">
              What we don&apos;t know
            </h3>
            <ul className="plain-list">
              {WHAT_WE_DONT_KNOW.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p className="drawer__confidence">{CONFIDENCE[confidence].text}</p>
          </section>

          <section aria-labelledby={`${titleId}-s`}>
            <h3 id={`${titleId}-s`} className="drawer__h">
              Where this comes from
            </h3>
            <ul className="source-list">
              {sources.map((s) => (
                <li key={s.id}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.title}
                    <ExternalLink size={14} strokeWidth={1.5} aria-hidden="true" />
                  </a>
                  <span>{s.publisher}</span>
                </li>
              ))}
            </ul>
            <p className="drawer__note">
              Scores are transparent rules, not a medical model. <Link href="/how-it-works#scores">See exactly how they are built</Link>.
            </p>
          </section>
        </div>
      )}
    </dialog>
  );
}
