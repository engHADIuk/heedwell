import { ArrowRight, CloudSun, FileText, Lock, MapPin, Share2, ShieldCheck, Smartphone } from "lucide-react";
import Link from "next/link";
import { ExampleWeek } from "@/components/home/ExampleWeek";
import { Faq } from "@/components/home/Faq";
import { FinalCta } from "@/components/home/FinalCta";
import { Hero } from "@/components/home/Hero";
import { Photo } from "@/components/Photo";
import { ThreatIcon } from "@/components/ui";
import type { PhotoKey } from "@/lib/photos";
import type { ThreatId } from "@/lib/risk/types";

const TRUST = [
  { Icon: CloudSun, text: "Real local weather" },
  { Icon: ShieldCheck, text: "Published sources for every rule" },
  { Icon: Smartphone, text: "Pet details stay on your device" },
  { Icon: Lock, text: "No ads, no shop, no account" },
];

const STEPS = [
  {
    Icon: MapPin,
    title: "Tell us where you are and who it's for",
    text: "A postcode and a short profile: species, age, where you walk and anything you've noticed. It takes about a minute, and you can skip any question.",
  },
  {
    Icon: CloudSun,
    title: "We read the weather",
    text: "Heedwell looks at temperature, humidity, rain and soil moisture for the last seven days and the week ahead, then applies published rules for each parasite.",
  },
  {
    Icon: FileText,
    title: "You get a week you can act on",
    text: "A score for each day with a plain-English reason, what to do this week, and a one-page summary to take to your vet.",
  },
];

const PARASITES: {
  id: ThreatId;
  name: string;
  photo: PhotoKey;
  when: string;
  summary: string;
  drivers: string;
  who: string;
}[] = [
  {
    id: "ticks",
    name: "Ticks",
    photo: "forest-path",
    when: "February to November, busiest in spring",
    summary: "Small blood-feeding arachnids that wait in long grass and woodland.",
    drivers: "Several mild days in a row, damp air and recent rain.",
    who: "Dogs and cats",
  },
  {
    id: "fleas",
    name: "Fleas",
    photo: "cat-window",
    when: "All year, because heated homes keep them going",
    summary: "Tiny jumping insects that live on pets and, mostly, in bedding and carpets.",
    drivers: "Mild, humid weather outside and warm rooms inside.",
    who: "Dogs and cats",
  },
  {
    id: "harvestMites",
    name: "Harvest mites",
    photo: "field-dog",
    when: "July to November, busiest in August and September",
    summary: "Tiny orange mites in long grass that make skin very itchy.",
    drivers: "Warm, dry spells in late summer and early autumn.",
    who: "Dogs and cats",
  },
  {
    id: "lungworm",
    name: "Lungworm",
    photo: "garden",
    when: "Highest in late summer and autumn, some risk all year",
    summary: "A parasite dogs can catch from slugs, snails and the slime they leave behind.",
    drivers: "Mild, wet weather, when slugs and snails come out.",
    who: "Dogs only",
  },
];

const SHEET_CELLS: ("low" | "moderate" | "high")[][] = [
  ["moderate", "moderate", "moderate", "moderate", "moderate", "moderate", "moderate"],
  ["moderate", "moderate", "moderate", "moderate", "moderate", "moderate", "high"],
  ["low", "low", "low", "low", "low", "low", "low"],
];

export default function Home() {
  return (
    <main id="main">
      <Hero />

      <section className="strip" aria-label="What Heedwell is built on">
        <ul className="wrap strip__list glass">
          {TRUST.map(({ Icon, text }) => (
            <li key={text}>
              <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>
      </section>

      <section className="band story" aria-labelledby="story-title">
        <div className="wrap story__grid">
          <div>
            <h2 id="story-title" className="story__title">
              Parasite risk moves with the weather. Most of us only hear about it once a year.
            </h2>
          </div>
          <div className="story__body">
            <p>
              Ticks wake up once it stays at about 7 °C or above for several days. Fleas do well in mild, damp spells, and they never really leave a heated home. Slugs and snails, which carry lungworm, come out when it&apos;s wet and mild. Harvest mites arrive in the warm, dry end of summer.
            </p>
            <p>
              So the right time to think about protection changes from week to week. Heedwell turns the weather outside into a plan you can read in a minute, shows you why each score is what it is, and gives you a short list of questions for your vet.
            </p>
            <p className="story__source">
              In an Elanco survey of dog owners reported by PA in 2021, 42% said they weren&apos;t aware what lungworm is or how it infects dogs.{" "}
              <a href="https://itv.com/news/2021-06-18/thousands-of-dogs-could-be-at-risk-from-lungworm" target="_blank" rel="noopener noreferrer">
                ITV News
              </a>
            </p>
          </div>
        </div>
      </section>

      <section className="band band--tight" aria-labelledby="steps-title">
        <div className="wrap">
          <div className="section-head">
            <h2 id="steps-title">How it works</h2>
            <p>Three steps, about a minute, no sign-up.</p>
          </div>
          <ol className="steps">
            {STEPS.map(({ Icon, title, text }, i) => (
              <li key={title} className="step glass">
                <span className="step__num" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="step__icon">
                  <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="band band--tight" aria-labelledby="parasites-title">
        <div className="wrap">
          <div className="section-head">
            <h2 id="parasites-title">The four things Heedwell keeps an eye on</h2>
            <p>Each has its own season and its own weather. Heedwell scores them separately, so you can see which one matters this week.</p>
          </div>
          <ul className="parasites">
            {PARASITES.map((p) => (
              <li key={p.id} className={`parasite parasite--${p.id}`}>
                <Photo name={p.photo} decorative className="parasite__photo" sizes="(min-width: 900px) 25vw, 90vw" />
                <div className="parasite__scrim" aria-hidden="true" />
                <div className="parasite__body">
                  <span className="parasite__icon">
                    <ThreatIcon threat={p.id} size={22} />
                  </span>
                  <h3>{p.name}</h3>
                  <p className="parasite__summary">{p.summary}</p>
                  <dl className="parasite__facts">
                    <div>
                      <dt>Most active</dt>
                      <dd>{p.when}</dd>
                    </div>
                    <div>
                      <dt>What drives it</dt>
                      <dd>{p.drivers}</dd>
                    </div>
                    <div>
                      <dt>Affects</dt>
                      <dd>{p.who}</dd>
                    </div>
                  </dl>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="band band--soft" aria-labelledby="example-title">
        <div className="wrap">
          <div className="section-head">
            <h2 id="example-title">Try a week, right here</h2>
            <p>Tap a day. The scores change with the weather, the way they will for your pet.</p>
          </div>
          <ExampleWeek />
        </div>
      </section>

      <section className="band band--sand" aria-labelledby="vet-title">
        <div className="wrap vet">
          <div className="vet__copy">
            <h2 id="vet-title">A page your vet can read in a minute</h2>
            <p>
              Heedwell puts the week, your pet&apos;s details and anything you&apos;ve noticed onto one printable page, with questions to ask. Save it as a PDF, print it, or send a link.
            </p>
            <ul className="tick-list">
              <li>The week at a glance, with every score and level in words</li>
              <li>Your pet&apos;s age, walks and habits, plus anything you wrote in your own words</li>
              <li>Questions to ask, based on your pet&apos;s profile</li>
              <li>A QR code that opens the online version</li>
            </ul>
            <p className="vet__links">
              <Link href="/plan" className="btn btn-primary">
                See it for your pet
                <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
              </Link>
            </p>
          </div>
          <div className="vet__visual" aria-hidden="true">
            <Photo name="vet" decorative className="vet__photo" sizes="(min-width: 900px) 40vw, 100vw" />
            <div className="sheet-mini">
              <div className="sheet-mini__head">
                <span className="sheet-mini__brand">Heedwell</span>
                <span>Weekly parasite summary</span>
              </div>
              <p className="sheet-mini__name">Biscuit</p>
              <div className="sheet-mini__grid">
                {SHEET_CELLS.flat().map((lv, i) => (
                  <span key={i} className={`sheet-mini__cell lv-${lv}`} />
                ))}
              </div>
              <div className="sheet-mini__lines">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="band band--aurora privacy" aria-labelledby="privacy-title">
        <div className="wrap">
          <div className="section-head section-head--light">
            <h2 id="privacy-title">Your pet&apos;s details stay with you</h2>
            <p>Heedwell has no accounts and no database. Here is exactly what goes where.</p>
          </div>
          <div className="privacy__cols">
            <div className="privacy__col">
              <Smartphone size={26} strokeWidth={1.4} aria-hidden="true" />
              <h3>Stays on your device</h3>
              <p>Your pet&apos;s name, age, walks, habits and anything you&apos;ve noticed live in your browser. The scoring runs there too.</p>
            </div>
            <div className="privacy__col">
              <CloudSun size={26} strokeWidth={1.4} aria-hidden="true" />
              <h3>Sent once, for the weather</h3>
              <p>Your postcode goes to look up the weather. Heedwell doesn&apos;t store it, and nothing about your pet goes with it.</p>
            </div>
            <div className="privacy__col">
              <Share2 size={26} strokeWidth={1.4} aria-hidden="true" />
              <h3>Shared only if you choose</h3>
              <p>A vet link carries your pet&apos;s details and the first half of your postcode. You decide who gets it, and you&apos;re warned before you copy it.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="band" aria-labelledby="faq-title">
        <div className="wrap faq-wrap">
          <div className="section-head">
            <h2 id="faq-title">Questions people ask</h2>
            <p>
              The short answers. The long ones are on <Link href="/how-it-works">how it works</Link>.
            </p>
          </div>
          <Faq />
        </div>
      </section>

      <FinalCta />
    </main>
  );
}
