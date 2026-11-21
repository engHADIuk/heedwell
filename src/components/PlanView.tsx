"use client";

import { MapPin, Pencil, RefreshCw, TriangleAlert, WifiOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CONFIDENCE, LEVELS, THREATS, WHAT_WE_DONT_KNOW } from "@/lib/copy";
import { save, useSaved } from "@/lib/client/store";
import { useForecast } from "@/lib/client/useForecast";
import type { PhotoKey } from "@/lib/photos";
import { assess } from "@/lib/risk/engine";
import type { Forecast, PetProfile, ThreatId } from "@/lib/risk/types";
import { hasNotes, hasUrgentSigns, URGENT_MESSAGE } from "@/lib/symptoms";
import { weekdayName } from "@/lib/risk/util";
import { DemoButton } from "./DemoButton";
import { Photo } from "./Photo";
import { PlanGlance } from "./PlanGlance";
import { PostcodeForm } from "./PostcodeForm";
import { ThreatCard } from "./ThreatCard";
import { YourNotes } from "./YourNotes";
import { LevelBadge, ScoreRing } from "./ui";
import { WeatherPanel } from "./WeatherPanel";
import { WeekRibbon } from "./WeekRibbon";
import { WhyDialog } from "./WhyDialog";

const time = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }).format(new Date(iso));

export function PlanSkeleton() {
  return (
    <main id="main" className="plan" aria-busy="true">
      <p className="sr-only" role="status">
        Loading this week&apos;s weather
      </p>
      <div className="plan-top plan-top--loading">
        <div className="wrap plan-hero">
          <div className="plan-hero__text">
            <div className="skeleton skeleton--line skeleton--dark" style={{ width: "40%" }} />
            <div className="skeleton skeleton--title skeleton--dark" />
            <div className="skeleton skeleton--title skeleton--dark" style={{ width: "70%" }} />
          </div>
          <div className="skeleton skeleton--photo skeleton--dark" />
        </div>
      </div>
      <div className="wrap plan-body">
        <div className="skeleton skeleton--ribbon" />
        <div className="threats">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton skeleton--card" />
          ))}
        </div>
      </div>
    </main>
  );
}

function Notice({ tone = "info", icon, title, children, action }: { tone?: "info" | "error"; icon?: React.ReactNode; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className={`notice notice--${tone}`} role={tone === "error" ? "alert" : "status"}>
      {icon}
      <div>
        <p className="notice__title">{title}</p>
        {children && <p className="notice__text">{children}</p>}
      </div>
      {action}
    </div>
  );
}

export function PlanView() {
  const saved = useSaved();
  const router = useRouter();
  const { state, retry } = useForecast(saved.ready ? saved.postcode : null);

  if (!saved.ready) return <PlanSkeleton />;

  if (!saved.postcode) {
    return (
      <main id="main" className="wrap narrow plan-empty">
        <div className="glass panel">
          <h1 className="page-title">Start with your postcode</h1>
          <p className="lead">Heedwell reads the weather where you live and plans your pet&apos;s week around it. It takes about a minute.</p>
          <PostcodeForm
            submitLabel="Continue"
            autoFocus
            onSubmit={(pc) => {
              save({ postcode: pc });
              if (!saved.profile && !saved.skipped) router.push("/pet");
            }}
          />
          <p className="or-line">Or see how it looks first.</p>
          <DemoButton />
        </div>
      </main>
    );
  }

  if (state.status === "loading") return <PlanSkeleton />;

  if (state.status === "error") {
    if (state.code === "postcode_invalid" || state.code === "postcode_not_found") {
      return (
        <main id="main" className="wrap narrow plan-empty">
          <div className="glass panel">
            <h1 className="page-title">We couldn&apos;t find that postcode</h1>
            <p className="lead">Check it and try again. A full postcode works best, like RG27 9XA.</p>
            <PostcodeForm initial={saved.postcode} submitLabel="Try again" autoFocus onSubmit={(pc) => save({ postcode: pc })} />
          </div>
        </main>
      );
    }
    if (!state.lastGood) {
      const offline = state.code === "offline";
      return (
        <main id="main" className="wrap narrow plan-empty">
          <div className="glass panel">
            <h1 className="page-title">{offline ? "You're offline" : "We can't reach the weather service"}</h1>
            <p className="lead">
              {offline
                ? "Connect to the internet and try again. Heedwell needs today's weather to plan the week."
                : "It may be a short hiccup. Nothing you entered has been lost."}
            </p>
            <button type="button" className="btn btn-primary" onClick={retry}>
              <RefreshCw size={18} strokeWidth={1.75} aria-hidden="true" />
              Try again
            </button>
          </div>
        </main>
      );
    }
    return (
      <PlanReady
        forecast={state.lastGood}
        profile={saved.profile}
        banner={
          <Notice
            tone="error"
            icon={state.code === "offline" ? <WifiOff size={22} strokeWidth={1.5} aria-hidden="true" /> : <RefreshCw size={22} strokeWidth={1.5} aria-hidden="true" />}
            title={state.code === "offline" ? "You're offline." : "We can't reach the weather service right now."}
            action={
              <button type="button" className="btn btn-ghost btn-sm" onClick={retry}>
                Try again
              </button>
            }
          >
            Showing the last update from {time(state.lastGood.fetchedAt)}.
          </Notice>
        }
      />
    );
  }

  return <PlanReady forecast={state.forecast} profile={saved.profile} />;
}

function PlanReady({ forecast, profile, banner }: { forecast: Forecast; profile: PetProfile | null; banner?: React.ReactNode }) {
  const [selected, setSelected] = useState(0);
  const [why, setWhy] = useState<{ id: ThreatId; open: boolean } | null>(null);
  const [editing, setEditing] = useState(false);

  const assessment = useMemo(() => {
    try {
      return assess(forecast, profile);
    } catch {
      return null;
    }
  }, [forecast, profile]);

  if (!assessment) {
    return (
      <main id="main" className="wrap narrow plan-empty">
        <div className="glass panel">
          <h1 className="page-title">There isn&apos;t enough weather data yet</h1>
          <p className="lead">The weather service sent less than a week of readings. Try again in a few minutes.</p>
        </div>
      </main>
    );
  }

  const updated = time(forecast.fetchedAt);
  const sel = assessment.daily[selected];
  const selWeekday = selected === 0 ? "Today" : weekdayName(sel.date);
  const sorted = [...assessment.threats].sort((a, b) => b.week.score - a.week.score);
  const photo: PhotoKey = profile?.species === "cat" ? "cat-window" : "field-dog";
  const name = profile?.name;
  const whyThreat = why ? (assessment.threats.find((t) => t.threat === why.id) ?? null) : null;
  const from = forecast.days.slice(forecast.todayIndex);

  const urgent = hasUrgentSigns(profile);

  return (
    <main id="main" className="plan">
      <div className="plan-top">
        <div className="wrap plan-hero">
          <div className="plan-hero__text">
            <p className="plan-place">
              <MapPin size={18} strokeWidth={1.5} aria-hidden="true" />
              {forecast.place.label}
              <button type="button" className="link-btn" onClick={() => setEditing((e) => !e)} aria-expanded={editing}>
                Change
              </button>
            </p>
            {editing && (
              <div className="plan-place__form">
                <PostcodeForm
                  tone="dark"
                  initial={forecast.place.postcode}
                  submitLabel="Update"
                  autoFocus
                  hint="Weather will reload for the new postcode."
                  onSubmit={(pc) => {
                    save({ postcode: pc });
                    setEditing(false);
                  }}
                />
              </div>
            )}
            <h1 id="plan-title" className="plan-title">
              <span>{`A ${LEVELS[assessment.overall.level].adjective} week ahead${name ? ` for ${name}` : ""}.`}</span>{" "}
              <span className="plan-title__sub">{assessment.weather.phrase}</span>
            </h1>
            <p className="plan-confidence">{CONFIDENCE[assessment.confidence].text}</p>
            <p className="plan-links">
              <Link href="/pet" className="link-light">
                <Pencil size={16} strokeWidth={1.5} aria-hidden="true" />
                {profile ? `Edit ${profile.name}'s details` : "Add your pet's details"}
              </Link>
              <Link href="/summary" className="link-light">
                Vet summary
              </Link>
            </p>
          </div>

          <div className="plan-hero__visual">
            <Photo name={photo} priority className="plan-hero__photo" sizes="(min-width: 900px) 40vw, 100vw" />
            <div className="plan-score glass glass--onphoto" aria-live="polite">
              <ScoreRing score={sel.score} level={sel.level} size={112} label={`${selWeekday}, overall`} />
              <div className="plan-score__text">
                <p className="plan-score__day">{selWeekday}</p>
                <LevelBadge level={sel.level} />
                <p className="plan-score__top">Biggest risk: {THREATS[sel.topThreat].name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap plan-body">
        {banner}

        {urgent && (
          <div className="notice notice--urgent" role="alert">
            <TriangleAlert size={24} strokeWidth={1.5} aria-hidden="true" />
            <div>
              <p className="notice__title">{name ?? "Your pet"} may need a vet now.</p>
              <p className="notice__text">{URGENT_MESSAGE}</p>
            </div>
          </div>
        )}

        <PlanGlance assessment={assessment} weather={from} />

        <section aria-labelledby="ribbon-title" className="plan-section">
          <div className="plan-section__head">
            <h2 id="ribbon-title">Your week</h2>
            <p>Choose a day to see its scores.</p>
          </div>
          <WeekRibbon assessment={assessment} weather={from} selected={selected} onSelect={setSelected} />
          <ul className="level-key" aria-label="What the bar shapes mean">
            <li className="lv-low">Low</li>
            <li className="lv-moderate">Moderate</li>
            <li className="lv-high">High, striped</li>
            <li className="lv-veryHigh">Very high, dotted</li>
          </ul>
        </section>

        <section className="plan-section" aria-labelledby="risks-title">
          <div className="plan-section__head">
            <h2 id="risks-title">{selWeekday === "Today" ? "Today" : selWeekday}, one parasite at a time</h2>
            <p>Sorted by this week&apos;s risk. Open Why this score to see the reasons and sources.</p>
          </div>
          <div className="threats">
            {sorted.map((t) => (
              <ThreatCard key={t.threat} threat={t} selected={selected} updated={updated} profile={profile} onWhy={() => setWhy({ id: t.threat, open: true })} />
            ))}
          </div>
        </section>

        {hasNotes(profile) && profile && <YourNotes profile={profile} />}

        <WeatherPanel forecast={forecast} selectedDate={sel.date} />

        <section className="plan-foot">
          <div className="glass panel">
            <h2 className="panel__title">What we don&apos;t know</h2>
            <ul className="plain-list">
              {WHAT_WE_DONT_KNOW.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div className="glass panel panel--vet">
            <Photo name="vet" decorative className="panel--vet__photo" sizes="(min-width: 900px) 30vw, 100vw" />
            <div className="panel--vet__body">
              <h2 className="panel__title">Take this to your vet</h2>
              <p>A one-page summary of {name ?? "your pet"}&apos;s week, with questions to ask. Print it or send a link.</p>
              <Link href="/summary" className="btn btn-primary">
                Open the vet summary
              </Link>
            </div>
          </div>
        </section>
      </div>

      <WhyDialog threat={whyThreat} selected={selected} confidence={assessment.confidence} open={Boolean(why?.open)} onClose={() => setWhy((w) => (w ? { ...w, open: false } : w))} />
    </main>
  );
}
