import type { Metadata } from "next";
import { ClipboardList, Pill, ScanText, Stethoscope } from "lucide-react";
import Link from "next/link";
import { MedicineChecker } from "@/components/MedicineChecker";
import { PageHero } from "@/components/PageHero";
import { CATEGORIES } from "@/lib/copy";

export const metadata: Metadata = { title: "Medicine check" };

const HOW = [
  {
    Icon: ScanText,
    title: "Find the active ingredient",
    text: "It's printed on the box or leaflet, usually under a heading like active substance. It's a long chemical name, not the product name.",
  },
  {
    Icon: Pill,
    title: "Search for it",
    text: "Heedwell checks the UK register of authorised veterinary medicines and shows which animals products with that ingredient are authorised for.",
  },
  {
    Icon: Stethoscope,
    title: "Talk to your vet or pharmacist",
    text: "The register can't tell you whether something is right for your pet, or what dose to give. Use the result as a starting point for that conversation.",
  },
];

const ASK = [
  "Is this ingredient suitable for my pet's age, weight and health?",
  "Does it fit with anything else my pet is taking, including other pets' treatments in our home?",
  "Is a product with this ingredient authorised for my kind of pet?",
  "How often should it be given, and what should I do if I miss a dose?",
];

export default function MedicinesPage() {
  return (
    <main id="main">
      <PageHero
        title="Check an ingredient"
        photo="vet"
        lead="See which animals an active ingredient is authorised for in the UK, and whether that fits the animals in your home. It is a starting point for a conversation with your vet or pharmacist."
      />

      <section className="band band--tight meds-band" aria-label="Ingredient search">
        <div className="wrap narrow">
          <MedicineChecker />
        </div>
      </section>

      <section className="band band--soft" aria-labelledby="how-title">
        <div className="wrap">
          <div className="section-head">
            <h2 id="how-title">How to use this page</h2>
            <p>Heedwell never names products. It works at the level of the ingredient, the way your vet or pharmacist would.</p>
          </div>
          <ol className="steps steps--plain">
            {HOW.map(({ Icon, title, text }) => (
              <li key={title} className="step glass">
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

      <section className="band" aria-labelledby="cats-title">
        <div className="wrap">
          <div className="section-head">
            <h2 id="cats-title">How medicines are supplied in the UK</h2>
            <p>Every veterinary medicine has a legal supply category. These are the four you will see in the results, in plain English.</p>
          </div>
          <ul className="cat-grid">
            {Object.entries(CATEGORIES).map(([code, c]) => (
              <li key={code} className="cat glass">
                <p className="cat__code">{code}</p>
                <h3>{c.short}</h3>
                <p>{c.long}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="band band--sand" aria-labelledby="ask-title">
        <div className="wrap ask">
          <div>
            <h2 id="ask-title">Questions to ask your vet or pharmacist</h2>
            <p className="ask__lead">Take these with you. The vet summary adds questions that fit your pet.</p>
            <Link href="/summary" className="btn btn-primary">
              <ClipboardList size={18} strokeWidth={1.75} aria-hidden="true" />
              Open the vet summary
            </Link>
          </div>
          <ul className="tick-list tick-list--large">
            {ASK.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
