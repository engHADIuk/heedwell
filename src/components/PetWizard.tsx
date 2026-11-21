"use client";

import { ArrowLeft, Check, Lock, Plus, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ageLabel, AGES, HABITS, HOUSEHOLD, TERRAINS, TERRAIN_LABEL } from "@/lib/copy";
import { save, useSaved, type Snapshot } from "@/lib/client/store";
import { CONCERNS_MAX, NOTE_MAX, cleanText, sanitiseProfile } from "@/lib/profile";
import type { PhotoKey } from "@/lib/photos";
import type { Age, Habit, Household, Species, Symptom, Terrain } from "@/lib/risk/types";
import { hasUrgentSigns, SYMPTOMS, URGENT_MESSAGE } from "@/lib/symptoms";
import { parsePostcode } from "@/lib/weather/postcode";
import { Photo } from "./Photo";

type StepId = "postcode" | "species" | "age" | "terrain" | "habits" | "household" | "noticed";

const STEP_LABEL: Record<StepId, string> = {
  postcode: "Where you are",
  species: "Your pet",
  age: "Age",
  terrain: "Walks",
  habits: "Habits",
  household: "At home",
  noticed: "Anything you've noticed",
};

function Tile({
  type,
  group,
  checked,
  onChange,
  label,
  blurb,
  photo,
  size = "md",
  other = false,
  urgent = false,
  wide = false,
}: {
  type: "radio" | "checkbox";
  group: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  blurb?: string;
  photo?: PhotoKey;
  size?: "md" | "lg";
  /** The "Other" choice: dashed, with a plus, and it opens a box to write in. */
  other?: boolean;
  urgent?: boolean;
  wide?: boolean;
}) {
  const cls = ["tile", `tile--${size}`, photo ? "tile--photo" : "", other ? "tile--other" : "", urgent ? "tile--urgent" : "", wide ? "tile--wide" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <label className={cls}>
      <input type={type} name={group} checked={checked} onChange={onChange} className="tile__input" />
      {photo && <Photo name={photo} decorative className="tile__photo" sizes="(min-width: 700px) 220px, 45vw" />}
      {other && (
        <span className="tile__plus" aria-hidden="true">
          <Plus size={20} strokeWidth={1.75} />
        </span>
      )}
      {urgent && <TriangleAlert size={18} strokeWidth={1.75} className="tile__warn" aria-hidden="true" />}
      <span className="tile__body">
        <span className="tile__label">{label}</span>
        {blurb && <span className="tile__blurb">{blurb}</span>}
      </span>
      <span className="tile__check" aria-hidden="true">
        <Check size={16} strokeWidth={2.25} />
      </span>
    </label>
  );
}

/** The box that opens when someone picks "Other". It says plainly what happens to what they write. */
function OtherField({
  label,
  value,
  onChange,
  max,
  multiline = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  multiline?: boolean;
  placeholder?: string;
}) {
  const id = useId();
  const common = {
    id,
    value,
    maxLength: max,
    placeholder,
    "aria-describedby": `${id}-help`,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
  };
  return (
    <div className="other-field">
      <label htmlFor={id}>{label}</label>
      {multiline ? <textarea rows={4} {...common} /> : <input type="text" autoComplete="off" {...common} />}
      <p id={`${id}-help`} className="field__help">
        <span>Not scored. It goes on your vet summary so your vet sees it.</span>
        <span className="field__count" aria-hidden="true">
          {value.length}/{max}
        </span>
      </p>
    </div>
  );
}

export function PetWizard() {
  const saved = useSaved();
  if (!saved.ready) {
    return (
      <main id="main" className="wrap" aria-busy="true">
        <div className="skeleton skeleton--wizard" />
      </main>
    );
  }
  return <WizardForm saved={saved} />;
}

function WizardForm({ saved }: { saved: Snapshot }) {
  const router = useRouter();
  const needsPostcode = !saved.postcode;
  const steps = useMemo<StepId[]>(
    () => [...(needsPostcode ? (["postcode"] as StepId[]) : []), "species", "age", "terrain", "habits", "household", "noticed"],
    [needsPostcode],
  );
  const p = saved.profile;

  const [step, setStep] = useState(0);
  const [postcode, setPostcode] = useState(saved.postcode ?? "");
  const [name, setName] = useState(p?.name ?? "");
  const [species, setSpecies] = useState<Species | null>(p?.species ?? null);
  const [age, setAge] = useState<Age | null>(p?.age ?? null);
  const [ageNote, setAgeNote] = useState(p?.ageNote ?? "");
  const [terrains, setTerrains] = useState<Terrain[]>(p?.terrains ?? []);
  const [terrainOther, setTerrainOther] = useState(Boolean(p?.terrainNote));
  const [terrainNote, setTerrainNote] = useState(p?.terrainNote ?? "");
  const [habits, setHabits] = useState<Habit[]>(p?.habits ?? []);
  const [habitOther, setHabitOther] = useState(Boolean(p?.habitNote));
  const [habitNote, setHabitNote] = useState(p?.habitNote ?? "");
  const [household, setHousehold] = useState<Household[]>(p?.household ?? []);
  const [householdOther, setHouseholdOther] = useState(Boolean(p?.householdNote));
  const [householdNote, setHouseholdNote] = useState(p?.householdNote ?? "");
  const [symptoms, setSymptoms] = useState<Symptom[]>(p?.symptoms ?? []);
  const [concernsOn, setConcernsOn] = useState(Boolean(p?.concerns));
  const [concerns, setConcerns] = useState(p?.concerns ?? "");
  const [error, setError] = useState<string | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  const nameId = useId();
  const pcId = useId();

  useEffect(() => {
    if (moved.current) headingRef.current?.focus();
    moved.current = true;
  }, [step]);

  const id = steps[step];
  const last = step === steps.length - 1;
  const petName = name.trim() || "your pet";
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const urgent = hasUrgentSigns({ symptoms, concerns: concernsOn ? concerns : "" });

  function validate(): string | null {
    if (id === "postcode" && !parsePostcode(postcode)) return "That doesn't look like a UK postcode. Try something like RG27 9XA.";
    if (id === "species") {
      if (!name.trim()) return "Tell us your pet's name.";
      if (!species) return "Choose dog or cat.";
    }
    if (id === "age") {
      if (!age) return "Choose an age, or pick Other and write it in.";
      if (age === "other" && !ageNote.trim()) return "Write how old your pet is, or choose one of the ranges.";
    }
    return null;
  }

  function draft() {
    return sanitiseProfile({
      name,
      species,
      age,
      terrains,
      habits,
      household,
      ageNote: age === "other" ? ageNote : undefined,
      terrainNote: terrainOther ? terrainNote : undefined,
      habitNote: habitOther ? habitNote : undefined,
      householdNote: householdOther ? householdNote : undefined,
      symptoms,
      concerns: concernsOn ? concerns : undefined,
    });
  }

  function finish() {
    const profile = draft();
    if (!profile) return;
    save({ postcode: parsePostcode(postcode)?.value ?? saved.postcode, profile, skipped: false });
    router.push("/plan");
  }

  function next(e?: React.FormEvent) {
    e?.preventDefault();
    const problem = validate();
    if (problem) return setError(problem);
    setError(null);
    if (last) finish();
    else setStep((s) => s + 1);
  }

  function skip() {
    const pc = parsePostcode(postcode)?.value ?? saved.postcode;
    if (!pc) return;
    save({ postcode: pc, profile: null, skipped: true });
    router.push("/plan");
  }

  const heading: Record<StepId, string> = {
    postcode: "Where are you?",
    species: "Who is this plan for?",
    age: `How old is ${petName}?`,
    terrain: `Where does ${petName} walk?`,
    habits: `Anything ${petName} does that we should know about?`,
    household: "Who else is at home?",
    noticed: `Have you noticed anything about ${petName}?`,
  };

  // The "so far" card beside the form.
  const soFar = [
    name.trim() && species ? { k: "Pet", v: `${name.trim()}, ${species === "dog" ? "dog" : "cat"}` } : null,
    age && (age !== "other" || cleanText(ageNote, NOTE_MAX)) ? { k: "Age", v: ageLabel({ age, ageNote: cleanText(ageNote, NOTE_MAX) }) } : null,
    terrains.length || terrainNote.trim() ? { k: "Walks", v: [...terrains.map((t) => TERRAIN_LABEL[t].toLowerCase()), terrainOther && terrainNote.trim() ? "other" : ""].filter(Boolean).join(", ") } : null,
    symptoms.length || (concernsOn && concerns.trim()) ? { k: "Noticed", v: `${symptoms.length + (concernsOn && concerns.trim() ? 1 : 0)} thing${symptoms.length + (concernsOn && concerns.trim() ? 1 : 0) === 1 ? "" : "s"}` } : null,
  ].filter((x): x is { k: string; v: string } => Boolean(x));

  const asidePhoto: PhotoKey = species === "cat" ? "cat-window" : "field-dog";

  return (
    <main id="main" className="wiz-page">
      <div className="wrap wiz">
        <aside className="wiz__aside" aria-label="Your progress">
          <Photo name={asidePhoto} decorative className="wiz__photo" sizes="(min-width: 900px) 34vw, 100vw" />
          <div className="wiz__scrim" aria-hidden="true" />
          <div className="wiz__aside-inner">
            <p className="wiz__aside-title">Setting up {petName === "your pet" ? "your plan" : `${petName}'s plan`}</p>
            <ol className="stepper">
              {steps.map((s, i) => (
                <li key={s} className={i === step ? "is-current" : i < step ? "is-done" : ""} aria-current={i === step ? "step" : undefined}>
                  <span className="stepper__dot" aria-hidden="true">
                    {i < step ? <Check size={14} strokeWidth={2.5} /> : i + 1}
                  </span>
                  <span>{STEP_LABEL[s]}</span>
                </li>
              ))}
            </ol>
            {soFar.length > 0 && (
              <dl className="sofar glass glass--onphoto" aria-label="What you've told us so far">
                {soFar.map((r) => (
                  <div key={r.k}>
                    <dt>{r.k}</dt>
                    <dd>{r.v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </aside>

        <form className="wiz__form glass" onSubmit={next} noValidate>
          <div className="wizard__top">
            <p className="wizard__count">
              Step {step + 1} of {steps.length}
            </p>
            <div className="wizard__bar" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={step + 1} aria-label="Progress">
              <span style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
            </div>
          </div>

          <h1 ref={headingRef} tabIndex={-1} className="wizard__title">
            {heading[id]}
          </h1>

          {id === "postcode" && (
            <div className="field">
              <label htmlFor={pcId}>Your postcode</label>
              <input id={pcId} type="text" autoComplete="postal-code" autoCapitalize="characters" spellCheck={false} placeholder="RG27 9XA" value={postcode} onChange={(e) => setPostcode(e.target.value)} autoFocus />
              <p className="field__help">We use it to look up your local weather. We don&apos;t keep it.</p>
            </div>
          )}

          {id === "species" && (
            <>
              <fieldset className="choice">
                <legend className="sr-only">Dog or cat</legend>
                <div className="choice__grid choice__grid--2">
                  <Tile type="radio" group="species" size="lg" checked={species === "dog"} onChange={() => setSpecies("dog")} label="Dog" photo="field-dog" />
                  <Tile
                    type="radio"
                    group="species"
                    size="lg"
                    checked={species === "cat"}
                    onChange={() => {
                      setSpecies("cat");
                      setHabits((h) => h.filter((x) => x !== "eatsGrass" && x !== "eatsSlugs"));
                    }}
                    label="Cat"
                    photo="cat-window"
                  />
                </div>
              </fieldset>
              <p className="choice__note">Heedwell plans for dogs and cats for now. For any other animal, your vet is the best guide.</p>
              <div className="field">
                <label htmlFor={nameId}>Their name</label>
                <input id={nameId} type="text" maxLength={24} autoComplete="off" placeholder="Biscuit" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </>
          )}

          {id === "age" && (
            <fieldset className="choice">
              <legend className="sr-only">Age</legend>
              <div className="choice__grid choice__grid--2">
                {AGES.map((a) => (
                  <Tile key={a.id} type="radio" group="age" checked={age === a.id} onChange={() => setAge(a.id)} label={a.label} blurb={a.blurb} />
                ))}
                <Tile type="radio" group="age" other wide checked={age === "other"} onChange={() => setAge("other")} label="Other or not sure" blurb="Describe it in your own words." />
              </div>
              {age === "other" && <OtherField label="How old is your pet?" value={ageNote} onChange={setAgeNote} max={NOTE_MAX} placeholder="For example, 12 weeks old, or a rescue of about 5" />}
            </fieldset>
          )}

          {id === "terrain" && (
            <fieldset className="choice">
              <legend className="choice__legend">Pick all that apply. Choose none if {petName} stays mostly indoors.</legend>
              <div className="choice__grid choice__grid--3">
                {TERRAINS.map((t) => (
                  <Tile key={t.id} type="checkbox" group="terrain" checked={terrains.includes(t.id)} onChange={() => setTerrains((l) => toggle(l, t.id))} label={t.label} photo={t.photo} />
                ))}
                <Tile type="checkbox" group="terrain" other checked={terrainOther} onChange={() => setTerrainOther((v) => !v)} label="Somewhere else" />
              </div>
              {terrainOther && <OtherField label={`Where else does ${petName} go?`} value={terrainNote} onChange={setTerrainNote} max={NOTE_MAX} placeholder="For example, a farm, a riverbank or a campsite" />}
            </fieldset>
          )}

          {id === "habits" && (
            <fieldset className="choice">
              <legend className="choice__legend">Pick all that apply.</legend>
              <div className="choice__grid choice__grid--2">
                {HABITS.filter((h) => !h.only || h.only === species).map((h) => (
                  <Tile key={h.id} type="checkbox" group="habits" checked={habits.includes(h.id)} onChange={() => setHabits((l) => toggle(l, h.id))} label={h.label} blurb={h.blurb} />
                ))}
                <Tile type="checkbox" group="habits" other checked={habitOther} onChange={() => setHabitOther((v) => !v)} label="Something else" blurb="Anything not on the list." />
              </div>
              {habitOther && <OtherField label={`What else does ${petName} do?`} value={habitNote} onChange={setHabitNote} max={NOTE_MAX} placeholder="For example, drinks from puddles or digs in compost" />}
            </fieldset>
          )}

          {id === "household" && (
            <fieldset className="choice">
              <legend className="choice__legend">Some parasites can affect people too. This helps your vet, and it stays on your device.</legend>
              <div className="choice__grid choice__grid--1">
                {HOUSEHOLD.map((h) => (
                  <Tile key={h.id} type="checkbox" group="household" checked={household.includes(h.id)} onChange={() => setHousehold((l) => toggle(l, h.id))} label={h.label} blurb={h.blurb} />
                ))}
                <Tile type="checkbox" group="household" other checked={householdOther} onChange={() => setHouseholdOther((v) => !v)} label="Something else" blurb="Anyone or anything else at home your vet should know about." />
              </div>
              {householdOther && <OtherField label="Tell us more" value={householdNote} onChange={setHouseholdNote} max={NOTE_MAX} placeholder="For example, a new baby, a pregnant family member or a pet rabbit" />}
            </fieldset>
          )}

          {id === "noticed" && (
            <>
              <fieldset className="choice">
                <legend className="choice__legend">
                  Pick anything that applies. Heedwell can&apos;t tell you what it means. It adds it to your vet summary so your vet sees it.
                </legend>
                <div className="choice__grid choice__grid--2">
                  {SYMPTOMS.map((s) => (
                    <Tile key={s.id} type="checkbox" group="symptoms" urgent={s.urgent} checked={symptoms.includes(s.id)} onChange={() => setSymptoms((l) => toggle(l, s.id))} label={s.label} />
                  ))}
                  <Tile type="checkbox" group="symptoms" other wide checked={concernsOn} onChange={() => setConcernsOn((v) => !v)} label="Something else" blurb="Describe anything else in your own words." />
                </div>
                {concernsOn && (
                  <OtherField
                    label={`What have you seen in ${petName}?`}
                    value={concerns}
                    onChange={setConcerns}
                    max={CONCERNS_MAX}
                    multiline
                    placeholder="For example, scratching more since Tuesday, a small lump behind the left ear, or less keen on walks"
                  />
                )}
              </fieldset>
              {urgent ? (
                <div className="notice notice--urgent" role="alert">
                  <TriangleAlert size={24} strokeWidth={1.5} aria-hidden="true" />
                  <div>
                    <p className="notice__title">Please call your vet now.</p>
                    <p className="notice__text">{URGENT_MESSAGE}</p>
                  </div>
                </div>
              ) : (
                <p className="choice__note">If you&apos;re worried, book a visit with your vet. Heedwell is a planning tool, not a diagnosis.</p>
              )}
            </>
          )}

          {error && (
            <p className="wizard__error" role="alert">
              {error}
            </p>
          )}

          <p className="wizard__privacy">
            <Lock size={16} strokeWidth={1.5} aria-hidden="true" />
            {petName === "your pet" ? "Your pet's" : `${petName}'s`} details stay on your device. No account needed.
          </p>

          <div className="wizard__nav">
            {step > 0 ? (
              <button
                type="button"
                className="btn btn-quiet"
                onClick={() => {
                  setError(null);
                  setStep((s) => s - 1);
                }}
              >
                <ArrowLeft size={18} strokeWidth={1.75} aria-hidden="true" />
                Back
              </button>
            ) : (
              <span />
            )}
            <div className="wizard__right">
              {id !== "postcode" && (
                <button type="button" className="btn btn-quiet" onClick={skip}>
                  Skip and use averages
                </button>
              )}
              <button type="submit" className="btn btn-primary">
                {last ? `See ${petName === "your pet" ? "the" : `${petName}'s`} week` : "Next"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
