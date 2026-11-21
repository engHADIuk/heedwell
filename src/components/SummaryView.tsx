"use client";

import { Check, Link2, Mail, Printer, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import { ageLabel, BRAND, CONFIDENCE, HABIT_LABEL, HOUSEHOLD_LABEL, LEVELS, TERRAIN_LABEL, THREATS } from "@/lib/copy";
import { useSaved } from "@/lib/client/store";
import { useForecast } from "@/lib/client/useForecast";
import { assess } from "@/lib/risk/engine";
import { explain } from "@/lib/risk/rules";
import type { Assessment, Forecast, Level, PetProfile } from "@/lib/risk/types";
import { dayMonthLabel, joinWords, weekdayName } from "@/lib/risk/util";
import { decodeShare, encodeShare } from "@/lib/summary/share";
import { hasUrgentSigns, SYMPTOM_LABEL, URGENT_MESSAGE } from "@/lib/symptoms";
import { Photo } from "./Photo";
import { BrandMark } from "./ui";

const SHORT: Record<Level, string> = { low: "Low", moderate: "Mod.", high: "High", veryHigh: "V. high" };

function questionsFor(profile: PetProfile, a: Assessment): string[] {
  const n = profile.name;
  const top = [...a.threats].sort((x, y) => y.week.score - x.week.score).slice(0, 2);
  const q: string[] = [];
  if (profile.symptoms?.length || profile.concerns) {
    q.push(`I've noticed some changes in ${n} (listed above). Could any of them be linked to parasites, or do they need a check-up?`);
  }
  q.push(...top.map((t) => THREATS[t.threat].askVet.replaceAll("{name}", n)));
  if (profile.age === "under1") q.push(`${n} is under a year old. What protection is suitable for their age and weight?`);
  if (profile.age === "8plus") q.push(`${n} is a senior. Does their age change which protection you recommend?`);
  if (profile.habits.includes("travelledAbroad")) q.push(`${n} has travelled abroad. Are there parasites we should check for?`);
  if (profile.household.includes("children") || profile.household.includes("immunocompromised")) {
    q.push("Someone in our home may be more vulnerable to parasites and infections. What extra precautions do you suggest?");
  }
  q.push(`Is there anything about ${n}'s health or current treatments that changes this advice?`);
  return q;
}

export function SummaryView() {
  const params = useSearchParams();
  const sharedParam = params.get("s");
  const shared = useMemo(() => decodeShare(sharedParam), [sharedParam]);
  const saved = useSaved();

  const profile = shared ? shared.profile : saved.profile;
  const postcode = shared ? shared.outcode : saved.postcode;
  const ready = shared ? true : saved.ready;
  const { state, retry } = useForecast(ready && profile ? postcode : null);

  if (sharedParam && !shared) {
    return (
      <main id="main" className="wrap narrow plan-empty">
        <div className="glass panel">
          <h1 className="page-title">This link looks damaged</h1>
          <p className="lead">Ask the person who sent it to share the summary again.</p>
          <Link href="/" className="btn btn-primary">
            Go to Heedwell
          </Link>
        </div>
      </main>
    );
  }

  if (!ready) {
    return (
      <main id="main" className="wrap narrow" aria-busy="true">
        <div className="skeleton skeleton--wizard" />
      </main>
    );
  }

  if (!profile || !postcode) {
    return (
      <main id="main" className="wrap narrow plan-empty">
        <div className="glass panel">
          <h1 className="page-title">Add your pet to make a summary</h1>
          <p className="lead">The vet summary uses your pet&apos;s details and this week&apos;s weather. Add them first.</p>
          <Link href="/pet" className="btn btn-primary">
            Add your pet
          </Link>
        </div>
      </main>
    );
  }

  const forecast = state.status === "ready" ? state.forecast : state.status === "error" ? state.lastGood : null;

  if (state.status === "loading") {
    return (
      <main id="main" className="wrap narrow" aria-busy="true">
        <p className="sr-only" role="status">
          Loading the summary
        </p>
        <div className="skeleton skeleton--wizard" />
      </main>
    );
  }

  if (!forecast) {
    return (
      <main id="main" className="wrap narrow plan-empty">
        <div className="glass panel">
          <h1 className="page-title">We can&apos;t build the summary yet</h1>
          <p className="lead">{state.status === "error" ? state.message : "Something went wrong."} Try again in a moment.</p>
          <button type="button" className="btn btn-primary" onClick={retry}>
            Try again
          </button>
        </div>
      </main>
    );
  }

  return <Sheet profile={profile} forecast={forecast} shared={Boolean(shared)} stale={state.status === "error"} />;
}

function Sheet({ profile, forecast, shared, stale }: { profile: PetProfile; forecast: Forecast; shared: boolean; stale: boolean }) {
  const assessment = useMemo(() => assess(forecast, profile), [forecast, profile]);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Built on the device. Only the outward half of the postcode goes in the link.
  const link = useMemo(
    () =>
      typeof window === "undefined"
        ? ""
        : `${window.location.origin}/summary?s=${encodeShare({ v: 1, outcode: forecast.place.outcode, profile })}`,
    [forecast.place.outcode, profile],
  );

  useEffect(() => {
    if (!link) return;
    let live = true;
    QRCode.toDataURL(link, { margin: 1, width: 256, errorCorrectionLevel: "L", color: { dark: "#0B3C3F", light: "#FFFFFF" } })
      .then((d) => live && setQr(d))
      .catch(() => live && setQr(null));
    return () => {
      live = false;
    };
  }, [link]);

  const days = assessment.daily;
  const range = `${dayMonthLabel(days[0].date)} to ${dayMonthLabel(days[days.length - 1].date)} ${days[days.length - 1].date.slice(0, 4)}`;
  const questions = useMemo(() => questionsFor(profile, assessment), [profile, assessment]);
  const updated = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }).format(new Date(forecast.fetchedAt));
  const sorted = [...assessment.threats].sort((a, b) => b.week.score - a.week.score);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this link", link);
    }
  }

  function email() {
    const subject = encodeURIComponent(`${profile.name}'s parasite week`);
    const body = encodeURIComponent(
      `Hello,\n\nHere is ${profile.name}'s weekly parasite summary from Heedwell:\n${link}\n\n${BRAND.disclaimer}`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <main id="main" className="wrap summary">
      <div className="summary__tools no-print">
        {shared && (
          <div className="notice notice--info" role="status">
            <div>
              <p className="notice__title">This summary was shared with you.</p>
              <p className="notice__text">It shows the details the owner chose to include, with this week&apos;s weather for their area.</p>
            </div>
          </div>
        )}
        {stale && (
          <div className="notice notice--error" role="status">
            <div>
              <p className="notice__title">We can&apos;t reach the weather service right now.</p>
              <p className="notice__text">This uses the last update from {updated}.</p>
            </div>
          </div>
        )}
        <div className="summary__intro glass">
          <Photo name="vet" decorative className="summary__photo" sizes="(min-width: 900px) 240px, 100vw" />
          <div className="summary__intro-body">
            <h1 className="page-title page-title--sm">{shared ? `${profile.name}'s week` : "Take this to your vet"}</h1>
            <p>A one-page summary to start the conversation. It doesn&apos;t replace a vet&apos;s advice.</p>
            <div className="summary__actions">
              <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={18} strokeWidth={1.75} aria-hidden="true" />
                Print or save as PDF
              </button>
              {!shared && (
                <>
                  <button type="button" className="btn btn-ghost" onClick={copy} disabled={!link}>
                    {copied ? <Check size={18} strokeWidth={1.75} aria-hidden="true" /> : <Link2 size={18} strokeWidth={1.75} aria-hidden="true" />}
                    {copied ? "Link copied" : "Copy link"}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={email} disabled={!link}>
                    <Mail size={18} strokeWidth={1.75} aria-hidden="true" />
                    Email it
                  </button>
                </>
              )}
            </div>
            {!shared && (
              <p className="summary__warn">
                <TriangleAlert size={16} strokeWidth={1.5} aria-hidden="true" />
                Anyone with the link can see {profile.name}&apos;s details and your postcode area ({forecast.place.outcode}). Share it only with people you trust.
              </p>
            )}
            <p className="sr-only" role="status">
              {copied ? "Link copied to clipboard" : ""}
            </p>
          </div>
        </div>
      </div>

      <article className="sheet" aria-label={`${profile.name}'s weekly parasite summary`}>
        <header className="sheet__head">
          <div className="sheet__brand">
            <BrandMark size={26} />
            <span>Heedwell</span>
            <span className="sheet__kind">Weekly parasite summary</span>
          </div>
          <h2 className="sheet__title">{profile.name}</h2>
          <p className="sheet__sub">
            {profile.species === "dog" ? "Dog" : "Cat"}, {ageLabel(profile).toLowerCase()}. Week of {range}.
          </p>
        </header>

        <section className="sheet__cols">
          <div>
            <h3 className="sheet__h">About {profile.name}</h3>
            <dl className="dl">
              <div>
                <dt>Species</dt>
                <dd>{profile.species === "dog" ? "Dog" : "Cat"}</dd>
              </div>
              <div>
                <dt>Age</dt>
                <dd>{ageLabel(profile)}</dd>
              </div>
              <div>
                <dt>Walks</dt>
                <dd>
                  {profile.terrains.length ? joinWords(profile.terrains.map((t) => TERRAIN_LABEL[t].toLowerCase())) : profile.terrainNote ? "" : "Mostly indoors"}
                  {profile.terrainNote && <span className="dl__note">{profile.terrains.length ? `Also: ${profile.terrainNote}` : profile.terrainNote}</span>}
                </dd>
              </div>
              <div>
                <dt>Habits</dt>
                <dd>
                  {profile.habits.length ? joinWords(profile.habits.map((h) => HABIT_LABEL[h].toLowerCase())) : profile.habitNote ? "" : "None noted"}
                  {profile.habitNote && <span className="dl__note">{profile.habits.length ? `Also: ${profile.habitNote}` : profile.habitNote}</span>}
                </dd>
              </div>
              <div>
                <dt>At home</dt>
                <dd>
                  {profile.household.length ? joinWords(profile.household.map((h) => HOUSEHOLD_LABEL[h].toLowerCase())) : profile.householdNote ? "" : "Nothing noted"}
                  {profile.householdNote && <span className="dl__note">{profile.household.length ? `Also: ${profile.householdNote}` : profile.householdNote}</span>}
                </dd>
              </div>
            </dl>
          </div>
          <div>
            <h3 className="sheet__h">Area and data</h3>
            <dl className="dl">
              <div>
                <dt>Area</dt>
                <dd>
                  {forecast.place.label} ({forecast.place.outcode})
                </dd>
              </div>
              <div>
                <dt>Weather</dt>
                <dd>Open-Meteo, updated {updated}</dd>
              </div>
              <div>
                <dt>This week</dt>
                <dd>{assessment.weather.phrase}</dd>
              </div>
              <div>
                <dt>Confidence</dt>
                <dd>{CONFIDENCE[assessment.confidence].label}. Weather and published guidance, not local case counts.</dd>
              </div>
            </dl>
          </div>
        </section>

        {(profile.symptoms?.length || profile.concerns) && (
          <section className="sheet__noticed">
            <h3 className="sheet__h">What the owner has noticed</h3>
            {hasUrgentSigns(profile) && (
              <p className="sheet__urgent">
                <TriangleAlert size={16} strokeWidth={1.75} aria-hidden="true" />
                <span>{URGENT_MESSAGE}</span>
              </p>
            )}
            {profile.symptoms && profile.symptoms.length > 0 && (
              <ul className="chip-list">
                {profile.symptoms.map((x) => (
                  <li key={x}>{SYMPTOM_LABEL[x]}</li>
                ))}
              </ul>
            )}
            {profile.concerns && <p className="sheet__quote">{profile.concerns}</p>}
            <p className="sheet__key">Written by the owner. Heedwell has not assessed it and it does not change any score.</p>
          </section>
        )}

        <section>
          <h3 className="sheet__h">The week at a glance</h3>
          <div className="glance-wrap">
          <table className="glance">
            <caption className="sr-only">Risk level for each parasite on each day, with its score out of 100</caption>
            <thead>
              <tr>
                <th scope="col">Parasite</th>
                {days.map((d, i) => (
                  <th scope="col" key={d.date}>
                    {i === 0 ? "Today" : weekdayName(d.date, "short")}
                    <span>{d.date.slice(8)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((t) => (
                <tr key={t.threat}>
                  <th scope="row">
                    {THREATS[t.threat].name}
                    <span>{explain(t.days[t.week.peakIndex].factors, t.week.level)}</span>
                  </th>
                  {t.days.map((d) => (
                    <td key={d.date} className={`lv-${d.level}`}>
                      <b>{SHORT[d.level]}</b>
                      <span>{d.score}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <p className="sheet__key">
            Scores are out of 100: Low under 30, Moderate 30 to 54, High 55 to 74, Very high 75 and over. Overall this week: {LEVELS[assessment.overall.level].label.toLowerCase()}.
          </p>
        </section>

        <section>
          <h3 className="sheet__h">Questions to ask your vet</h3>
          <ul className="sheet__list">
            {questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </section>

        <footer className="sheet__foot">
          <div>
            <p>
              <strong>{BRAND.disclaimer}</strong> Heedwell is an independent concept. It turns weather and published guidance into a plan and does not diagnose, prescribe or recommend products.
            </p>
            <p>Sources are listed at heedwell &gt; How it works. Weather data by Open-Meteo.com (CC BY 4.0).</p>
          </div>
          {qr && !shared && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} width={104} height={104} alt="QR code that opens this summary" className="sheet__qr" />
          )}
        </footer>
      </article>
    </main>
  );
}
