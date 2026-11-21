import type { Metadata } from "next";
import { Accessibility, CloudOff, ExternalLink, FlaskConical, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { DemoButton } from "@/components/DemoButton";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = { title: "About" };

const REPO = process.env.NEXT_PUBLIC_REPO_URL ?? "https://github.com/engHADIuk/heedwell";

const DECISIONS = [
  {
    Icon: Lock,
    title: "Pet details never leave the device",
    text: "The scoring runs in the browser. The server only turns a postcode into weather.",
  },
  {
    Icon: ShieldCheck,
    title: "Product-neutral by design",
    text: "UK rules restrict advertising prescription-only veterinary medicines to the public, so Heedwell names ingredients and never products, and has no buy buttons.",
  },
  {
    Icon: FlaskConical,
    title: "Honest about uncertainty",
    text: "Scores are transparent rules, every input is shown, and confidence is capped at medium because there is no local case data.",
  },
  {
    Icon: CloudOff,
    title: "Fails gently",
    text: "If the weather service is down, the last good update is shown and labelled. Postcode problems get a clear message, not a blank page.",
  },
  {
    Icon: Accessibility,
    title: "Built to be used by everyone",
    text: "Keyboard-friendly throughout, labelled for screen readers, never colour alone for risk, and it respects reduced motion and reduced transparency.",
  },
];

const NEXT_UP = [
  { title: "Local case data", text: "From vet practices who choose to share it, so confidence can honestly rise." },
  { title: "More than one pet", text: "And gentle reminders on the days a plan changes." },
  { title: "A view for practices", text: "Which parasites their clients should hear about this week." },
  { title: "More languages", text: "Plain-language versions for more owners." },
];

export default function About() {
  return (
    <main id="main">
      <PageHero
        title="About Heedwell"
        photo="golden-run"
        lead="Heedwell is an independent concept: a weekly parasite plan for UK dogs and cats, built on real local weather."
      >
        <DemoButton className="btn btn-mint">Try the example week</DemoButton>
        {REPO && (
          <a className="btn btn-glass" href={REPO} target="_blank" rel="noopener noreferrer">
            View the code
            <ExternalLink size={16} strokeWidth={1.5} aria-hidden="true" />
          </a>
        )}
      </PageHero>

      <section className="band" aria-labelledby="why">
        <div className="wrap story__grid">
          <div>
            <h2 id="why" className="story__title">
              Most owners know parasites matter. Fewer know when the risk changes, or why.
            </h2>
          </div>
          <div className="story__body">
            <p>
              In an Elanco survey of dog owners reported by PA in 2021, 42% said they weren&apos;t aware what lungworm is or how it infects dogs (
              <a href="https://itv.com/news/2021-06-18/thousands-of-dogs-could-be-at-risk-from-lungworm" target="_blank" rel="noopener noreferrer">
                ITV News
                <ExternalLink size={14} strokeWidth={1.5} aria-hidden="true" />
              </a>
              ).
            </p>
            <p>
              Heedwell tries to close that gap. It ties the weather outside to the week ahead, explains each score in plain English, and hands the owner a short list of questions for their vet.
            </p>
          </div>
        </div>
      </section>

      <section className="band band--soft" aria-labelledby="who">
        <div className="wrap who">
          <h2 id="who">Who built it</h2>
          <p>
            Created by Hadi, a software engineering student, as a portfolio project while applying for a placement at Elanco UK, and built with the help of an AI coding assistant. It isn&apos;t made, endorsed or reviewed by Elanco or by any veterinary body.
          </p>
        </div>
      </section>

      <section className="band" aria-labelledby="decisions">
        <div className="wrap">
          <div className="section-head">
            <h2 id="decisions">Decisions worth knowing about</h2>
            <p>Choices made on purpose, and why.</p>
          </div>
          <ul className="decisions">
            {DECISIONS.map(({ Icon, title, text }) => (
              <li key={title} className="decision glass">
                <span className="step__icon">
                  <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="band band--sand" aria-labelledby="built">
        <div className="wrap built">
          <h2 id="built">How it is built</h2>
          <p className="built__text">
            Next.js (App Router), React and TypeScript, with plain CSS. A test suite covers the scoring rules, weather parsing, the API route, share links and the medicines import, and runs in GitHub Actions on every push. The medicines list is built from the Veterinary Medicines Directorate&apos;s open data by a script in the repository. The scoring rules are written up in METHODOLOGY.md with the source for each.
          </p>
          <p className="built__text">
            See <Link href="/how-it-works">how it works</Link> for the sources and licences.
          </p>
        </div>
      </section>

      <section className="band" aria-labelledby="next">
        <div className="wrap">
          <div className="section-head">
            <h2 id="next">What could come next</h2>
          </div>
          <ul className="roadmap">
            {NEXT_UP.map((n) => (
              <li key={n.title} className="road glass">
                <h3>{n.title}</h3>
                <p>{n.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
