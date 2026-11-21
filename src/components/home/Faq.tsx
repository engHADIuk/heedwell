import { Plus } from "lucide-react";
import Link from "next/link";

const QUESTIONS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Is this veterinary advice?",
    a: "No. Heedwell turns weather and published guidance into a weekly plan. It can't examine your pet, doesn't know what they're already protected with, and never diagnoses anything. Your vet decides what's right for your pet.",
  },
  {
    q: "Where does the weather come from?",
    a: (
      <>
        From{" "}
        <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
          Open-Meteo
        </a>
        : hourly temperature, humidity, rain and soil moisture for your postcode, for the last seven days and the next seven. It isn&apos;t Met Office data.
      </>
    ),
  },
  {
    q: "Why doesn't it name any products?",
    a: "In the UK, prescription-only veterinary medicines can't be advertised to the public. So Heedwell sticks to ingredients and questions to ask your vet, and it has no shop links or buy buttons.",
  },
  {
    q: "Does it work for cats?",
    a: "Yes, for fleas, ticks and harvest mites. Lungworm is a dog parasite, so cats don't see it.",
  },
  {
    q: "What if my pet doesn't fit the options?",
    a: "Every question has an Other choice where you can write it in your own words, and there's a last step for anything you've noticed. Those notes go on your vet summary. They don't change the scores, because Heedwell can't judge them.",
  },
  {
    q: "Do you keep my postcode or my pet's details?",
    a: (
      <>
        Pet details stay in your browser and are never sent anywhere. Your postcode is sent once to look up the weather and Heedwell doesn&apos;t store it. Read more on the{" "}
        <Link href="/how-it-works#privacy">how it works</Link> page.
      </>
    ),
  },
];

export function Faq() {
  return (
    <div className="faq">
      {QUESTIONS.map(({ q, a }) => (
        <details key={q} className="faq__item">
          <summary>
            <span>{q}</span>
            <Plus size={20} strokeWidth={1.5} aria-hidden="true" />
          </summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  );
}
