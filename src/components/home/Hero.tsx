"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { save, useSaved } from "@/lib/client/store";
import { useSampleWeek } from "@/lib/client/useSampleWeek";
import { LEVELS, THREATS } from "@/lib/copy";
import { weekdayName } from "@/lib/risk/util";
import { DemoButton } from "../DemoButton";
import { Photo } from "../Photo";
import { PostcodeForm } from "../PostcodeForm";
import { LevelBadge, ScoreRing } from "../ui";

function HeroPreview() {
  const week = useSampleWeek();
  if (!week) return <div className="hero__float hero__float--a hero__float--empty glass glass--onphoto" aria-hidden="true" />;
  const { assessment, ahead } = week;
  const today = assessment.daily[0];
  return (
    <>
      <div className="hero__float hero__float--a glass glass--onphoto">
        <ScoreRing score={today.score} level={today.level} size={92} label="Example, today, overall" />
        <div className="hero__float-text">
          <p className="hero__float-kicker">Example · Hook, Hampshire</p>
          <LevelBadge level={today.level} />
          <p className="hero__float-line">Biggest risk today: {THREATS[today.topThreat].name}</p>
        </div>
      </div>
      <div className="hero__float hero__float--b glass glass--onphoto" aria-label="Example week">
        <ol className="mini-ribbon">
          {assessment.daily.map((d, i) => (
            <li key={d.date} className={`mini-ribbon__day lv-${d.level}`}>
              <span className="mini-ribbon__cap" style={{ "--fill": `${Math.max(12, d.score)}%` } as React.CSSProperties}>
                <span />
              </span>
              <span className="mini-ribbon__name">{i === 0 ? "Today" : weekdayName(d.date, "short")}</span>
              <span className="sr-only">
                {LEVELS[d.level].label}, {d.score} out of 100, {Math.round(ahead[i].tempMean)} degrees
              </span>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

export function Hero() {
  const router = useRouter();
  const saved = useSaved();
  const returning = saved.ready && saved.postcode && (saved.profile || saved.skipped);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="wrap hero__grid">
        <div className="hero__copy">
          <h1 id="hero-title" className="hero__title">
            Know what matters for your pet this week.
          </h1>
          <p className="hero__lead">
            Enter your postcode and a few details. Heedwell reads the local weather and plans a week of parasite protection around it, with the reasons laid out so you can check them.
          </p>

          <div className="hero__card glass glass--onphoto">
            <PostcodeForm
              tone="dark"
              submitLabel="Plan the week"
              initial={saved.postcode ?? ""}
              key={saved.ready ? "ready" : "loading"}
              onSubmit={(pc) => {
                save({ postcode: pc });
                router.push(saved.profile || saved.skipped ? "/plan" : "/pet");
              }}
            />
            <div className="hero__alt">
              {returning && saved.profile ? (
                <Link href="/plan" className="link-light">
                  Open {saved.profile.name}&apos;s week
                  <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
                </Link>
              ) : (
                <DemoButton className="link-light">See an example week</DemoButton>
              )}
            </div>
          </div>
        </div>

        <div className="hero__visual">
          <Photo name="golden-run" priority className="hero__photo" sizes="(min-width: 900px) 44vw, 100vw" />
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}
