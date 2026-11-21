import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { THRESHOLDS } from "@/lib/risk/rules";
import { PHOTO_LIST } from "@/lib/photos";
import { SOURCES } from "@/lib/risk/sources";

export const metadata: Metadata = { title: "How it works" };

const all = Object.values(SOURCES);
const DATA = all.filter((s) => s.kind === "data");
const EVIDENCE = all.filter((s) => s.kind !== "data");

const RULES = [
  {
    name: "Fleas",
    applies: "Dogs and cats",
    weather: "Temperature (best at 18 to 25 °C) and humidity (best at 70 to 85%) over the last 7 days.",
    season: "None. There is always a baseline of 30, because heated homes keep fleas going all year.",
    routine: "None. Fleas follow the home and the weather, not where you walk.",
  },
  {
    name: "Ticks",
    applies: "Dogs and cats",
    weather: "Days in a row at 7 °C or above (about 5 needed), humidity over the last 7 days, and rain in the last 3 days.",
    season: "Active February to November, peaking April to June.",
    routine: "Woodland, fields, parks and the garden. Hunting in undergrowth.",
  },
  {
    name: "Lungworm",
    applies: "Dogs only",
    weather: "Mild temperatures with rain and wet soil, because that is when slugs and snails are out.",
    season: "Highest in late summer and autumn, with some risk all year.",
    routine: "Eating slugs, snails or grass.",
  },
  {
    name: "Harvest mites",
    applies: "Dogs and cats",
    weather: "Warm days and dry spells over the last 7 days.",
    season: "July to November, peaking in August and September.",
    routine: "Fields, woodland, parks and the garden. Hunting in undergrowth.",
  },
];

const TOC = [
  { id: "privacy", label: "What stays on your device" },
  { id: "scores", label: "How a score is built" },
  { id: "real", label: "What is real and what is modelled" },
  { id: "wont", label: "What Heedwell won't do" },
  { id: "sources", label: "Sources and licences" },
];

export default function HowItWorks() {
  return (
    <main id="main" className="how-page">
      <PageHero
        title="How Heedwell works"
        photo="lake"
        lead="Heedwell turns the weather into a weekly plan. Here is every step, with the sources, so you can check the work."
      />
      <div className="wrap how">
        <nav className="toc" aria-label="On this page">
          <p className="toc__title">On this page</p>
          <ol>
            {TOC.map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`}>{t.label}</a>
              </li>
            ))}
          </ol>
        </nav>
        <article className="prose-page how__content">
      <section aria-labelledby="privacy">
        <h2 id="privacy">What stays on your device</h2>
        <p>
          Your pet&apos;s name, age, walks, habits and anything you write in your own words are kept in your browser and are never sent to a server. The scores are worked out on your device too. The only thing that leaves is your postcode, so the weather for your area can be looked up. It isn&apos;t stored.
        </p>
        <p>
          If you make a share link for your vet, it contains your pet&apos;s details and the first half of your postcode (for example RG27), so anyone with the link can read them.
        </p>
      </section>

      <section aria-labelledby="scores">
        <h2 id="scores">How a score is built</h2>
        <p>
          Each parasite gets a score from 0 to 100 for each of the next seven days. A score combines three things: the weather over the previous seven days, the time of year, and your pet&apos;s routine. The weather and the season can take a score to 80 at most. Your pet&apos;s routine decides the rest.
        </p>
        <p>
          These are simple, published rules, not a medical model. The exact numbers are in METHODOLOGY.md in the code. Anything you write under Other, or in the last step, isn&apos;t scored. It goes on your vet summary so your vet can see it.
        </p>

        <div className="formula" role="img" aria-label="Weather over the last seven days, multiplied by the time of year, adjusted by your pet's routine, gives a score from 0 to 100">
          <div className="formula__chip">
            <span>Weather</span>
            <small>last 7 days</small>
          </div>
          <span className="formula__op" aria-hidden="true">
            ×
          </span>
          <div className="formula__chip">
            <span>Time of year</span>
            <small>this month</small>
          </div>
          <span className="formula__op" aria-hidden="true">
            ×
          </span>
          <div className="formula__chip">
            <span>Your pet&apos;s routine</span>
            <small>walks and habits</small>
          </div>
          <span className="formula__op" aria-hidden="true">
            =
          </span>
          <div className="formula__chip formula__chip--result">
            <span>Score</span>
            <small>0 to 100</small>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <caption className="sr-only">How each parasite is scored</caption>
            <thead>
              <tr>
                <th scope="col">Parasite</th>
                <th scope="col">Weather</th>
                <th scope="col">Time of year</th>
                <th scope="col">Your pet&apos;s routine</th>
              </tr>
            </thead>
            <tbody>
              {RULES.map((r) => (
                <tr key={r.name}>
                  <th scope="row">
                    {r.name}
                    <span>{r.applies}</span>
                  </th>
                  <td>{r.weather}</td>
                  <td>{r.season}</td>
                  <td>{r.routine}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>Levels</h3>
        <ul className="level-key">
          <li className="lv-low">
            <b>Low</b> 0 to {THRESHOLDS.moderate - 1}
          </li>
          <li className="lv-moderate">
            <b>Moderate</b> {THRESHOLDS.moderate} to {THRESHOLDS.high - 1}
          </li>
          <li className="lv-high">
            <b>High</b> {THRESHOLDS.high} to {THRESHOLDS.veryHigh - 1}
          </li>
          <li className="lv-veryHigh">
            <b>Very high</b> {THRESHOLDS.veryHigh} to 100
          </li>
        </ul>

        <h3>How sure is it?</h3>
        <p>
          Heedwell shows medium confidence when you have given pet details and low confidence when you haven&apos;t. It never shows high confidence, because it has no case counts from your area. Treat it as a prompt to think about protection, not a forecast of what will happen.
        </p>
      </section>

      <section aria-labelledby="real">
        <h2 id="real">What is real and what is modelled</h2>
        <div className="two-col">
          <div>
            <h3>Real data</h3>
            <ul className="plain-list">
              <li>Hourly weather from Open-Meteo for your postcode.</li>
              <li>Place names from postcodes.io.</li>
              <li>Authorised ingredients and who they are for, from the UK Veterinary Medicines Directorate.</li>
            </ul>
          </div>
          <div>
            <h3>Modelled</h3>
            <ul className="plain-list">
              <li>The scores: rules built from the published guidance below.</li>
              <li>Your local conditions, which are estimated from the area&apos;s weather.</li>
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="wont">
        <h2 id="wont">What Heedwell won&apos;t do</h2>
        <p>
          It doesn&apos;t name products, link to shops or suggest doses, and it doesn&apos;t diagnose. In the UK, prescription-only veterinary medicines can&apos;t be advertised to the public, so Heedwell stays at the level of ingredients and questions for your vet. See{" "}
          <a href={SOURCES.govukVetMedsAdvertising.url} target="_blank" rel="noopener noreferrer">
            the GOV.UK guidance
            <ExternalLink size={14} strokeWidth={1.5} aria-hidden="true" />
          </a>
          .
        </p>
      </section>

      <section aria-labelledby="sources">
        <h2 id="sources">Sources and licences</h2>
        <h3>Data</h3>
        <div className="table-wrap">
          <table className="data-table">
            <caption className="sr-only">Data sources and licences</caption>
            <thead>
              <tr>
                <th scope="col">Source</th>
                <th scope="col">What it provides</th>
                <th scope="col">Licence</th>
              </tr>
            </thead>
            <tbody>
              {DATA.map((s) => (
                <tr key={s.id}>
                  <th scope="row">
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                    </a>
                    <span>{s.publisher}</span>
                  </th>
                  <td>{s.usedFor}</td>
                  <td>{s.licence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3>Evidence behind the rules</h3>
        <div className="table-wrap">
          <table className="data-table">
            <caption className="sr-only">Published guidance and research behind the scoring rules</caption>
            <thead>
              <tr>
                <th scope="col">Source</th>
                <th scope="col">What we take from it</th>
              </tr>
            </thead>
            <tbody>
              {EVIDENCE.filter((s) => s.id !== "govukVetMedsAdvertising").map((s) => (
                <tr key={s.id}>
                  <th scope="row">
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                    </a>
                    <span>{s.publisher}</span>
                  </th>
                  <td>{s.usedFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3>Photographs</h3>
        <p>
          Photographs are from Unsplash and used under the{" "}
          <a href="https://unsplash.com/license" target="_blank" rel="noopener noreferrer">
            Unsplash License
          </a>
          .
        </p>
        <ul className="plain-list">
          {PHOTO_LIST.map((p) => (
            <li key={p.file}>
              <a href={p.page} target="_blank" rel="noopener noreferrer">
                {p.alt}
              </a>
              , by {p.photographer}
            </li>
          ))}
        </ul>
      </section>
      </article>
      </div>
    </main>
  );
}
