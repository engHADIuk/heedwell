import { Pencil } from "lucide-react";
import Link from "next/link";
import { ageLabel } from "@/lib/copy";
import type { PetProfile } from "@/lib/risk/types";
import { SYMPTOM_LABEL } from "@/lib/symptoms";

/**
 * Everything the owner wrote in their own words. None of it is scored, and the panel says so,
 * so nobody thinks Heedwell has judged it.
 */
export function YourNotes({ profile }: { profile: PetProfile }) {
  const rows: { label: string; value: string }[] = [];
  if (profile.age === "other") rows.push({ label: "Age", value: ageLabel(profile) });
  else if (profile.ageNote) rows.push({ label: "Age", value: profile.ageNote });
  if (profile.terrainNote) rows.push({ label: "Walks", value: profile.terrainNote });
  if (profile.habitNote) rows.push({ label: "Habits", value: profile.habitNote });
  if (profile.householdNote) rows.push({ label: "At home", value: profile.householdNote });
  const symptoms = profile.symptoms ?? [];

  return (
    <section className="notes glass" aria-labelledby="notes-title">
      <div className="notes__head">
        <h2 id="notes-title">What you told us about {profile.name}</h2>
        <Link href="/pet" className="btn btn-ghost btn-sm">
          <Pencil size={16} strokeWidth={1.5} aria-hidden="true" />
          Edit
        </Link>
      </div>
      <p className="notes__intro">
        Heedwell can&apos;t score these, so they don&apos;t change the numbers above. They are on your vet summary, so your vet sees them.
      </p>
      {symptoms.length > 0 && (
        <div className="notes__block">
          <p className="notes__label">Noticed</p>
          <ul className="chip-list">
            {symptoms.map((s) => (
              <li key={s}>{SYMPTOM_LABEL[s]}</li>
            ))}
          </ul>
        </div>
      )}
      {profile.concerns && (
        <div className="notes__block">
          <p className="notes__label">In your words</p>
          <p className="notes__quote">{profile.concerns}</p>
        </div>
      )}
      {rows.length > 0 && (
        <dl className="notes__rows">
          {rows.map((r) => (
            <div key={r.label}>
              <dt>{r.label}</dt>
              <dd>{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {(symptoms.length > 0 || profile.concerns) && (
        <p className="notes__advice">If something is worrying you, book a visit with your vet. Don&apos;t wait for the next plan.</p>
      )}
    </section>
  );
}
