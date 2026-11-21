"use client";

import { Check, ExternalLink, Search, TriangleAlert, X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { CATEGORIES, SPECIES_LABEL } from "@/lib/copy";
import { useSaved } from "@/lib/client/store";
import { speciesCheck, type MedicineRecord, type MedicinesFile } from "@/lib/medicines/match";
import type { Species } from "@/lib/risk/types";

type Meta = MedicinesFile["meta"];
const noun = (s: Species) => (s === "dog" ? { plural: "dogs", one: "a dog" } : { plural: "cats", one: "a cat" });

export function MedicineChecker() {
  const saved = useSaved();
  const inputId = useId();
  const [q, setQ] = useState("");
  const [data, setData] = useState<{ q: string; results: MedicineRecord[] } | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [chosen, setChosen] = useState<MedicineRecord | null>(null);
  const [picked, setPicked] = useState<Species[] | null>(null);

  // Who is in the home: the pet, plus a pet of the other kind if the owner said there are other pets.
  const fromProfile = useMemo<Species[]>(() => {
    const p = saved.profile;
    if (!p) return ["dog"];
    return p.household.includes("otherPets") ? ["dog", "cat"] : [p.species];
  }, [saved.profile]);
  const home = picked ?? fromProfile;

  const query = q.trim();
  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(
      async () => {
        try {
          const res = await fetch(`/api/medicines?q=${encodeURIComponent(query)}`, { signal: ctrl.signal });
          const body = (await res.json()) as { meta: Meta; results: MedicineRecord[] };
          setMeta(body.meta);
          setData({ q: query, results: body.results });
        } catch {
          /* aborted or offline: keep what is on screen */
        }
      },
      query ? 200 : 0,
    );
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const results = data && data.q === query ? data.results : null;
  const check = chosen ? speciesCheck(chosen, home) : null;

  return (
    <div className="meds">
      {meta?.sample && (
        <div className="notice notice--info" role="status">
          <div>
            <p className="notice__title">You are looking at a small sample of the register.</p>
            <p className="notice__text">Run <code>npm run ingest</code> to load every active ingredient from the Veterinary Medicines Directorate.</p>
          </div>
        </div>
      )}

      <div className="glass panel meds__search">
        <fieldset className="chips">
          <legend>Animals in your home</legend>
          {(["dog", "cat"] as Species[]).map((s) => (
            <button key={s} type="button" className="chip" aria-pressed={home.includes(s)} onClick={() => setPicked(home.includes(s) ? home.filter((x) => x !== s) : [...home, s])}>
              {home.includes(s) && <Check size={16} strokeWidth={2} aria-hidden="true" />}
              {SPECIES_LABEL[s]}
            </button>
          ))}
        </fieldset>

        <div className="field">
          <label htmlFor={inputId}>Active ingredient</label>
          <div className="search-box">
            <Search size={20} strokeWidth={1.5} aria-hidden="true" />
            <input
              id={inputId}
              type="search"
              autoComplete="off"
              spellCheck={false}
              placeholder="For example, praziquantel"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setChosen(null);
              }}
              aria-describedby={`${inputId}-help`}
            />
            {q && (
              <button type="button" className="icon-btn" aria-label="Clear" onClick={() => { setQ(""); setChosen(null); }}>
                <X size={18} strokeWidth={1.5} aria-hidden="true" />
              </button>
            )}
          </div>
          <p id={`${inputId}-help`} className="field__help">
            Type the active ingredient printed on the box or leaflet. Heedwell checks the UK register of authorised veterinary medicines. It never names products.
          </p>
        </div>

        {!chosen && query.length >= 2 && results && (
          results.length ? (
            <ul className="med-results" aria-label="Matching ingredients">
              {results.map((r) => (
                <li key={r.key}>
                  <button type="button" onClick={() => setChosen(r)}>
                    <span className="med-results__name">{r.name}</span>
                    <span className="med-results__meta">
                      {[r.dog && "Dogs", r.cat && "Cats"].filter(Boolean).join(" and ") || "Not listed for dogs or cats"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty" role="status">
              No match yet. Try the active ingredient printed on the box.
            </p>
          )
        )}
      </div>

      {chosen && check && (
        <article className="glass panel med-card" aria-live="polite">
          <h2 className="med-card__name">{chosen.name}</h2>
          <p className="muted">
            Active ingredient. {chosen.products} authorised UK {chosen.products === 1 ? "product contains" : "products contain"} it.
          </p>

          {home.length === 0 && <p className="muted">Choose the animals in your home to see how this ingredient lines up.</p>}
          <ul className="species-rows">
            {home.map((s) => {
              const ok = chosen[s];
              return (
                <li key={s} className={ok ? "species-row species-row--ok" : "species-row species-row--no"}>
                  {ok ? <Check size={18} strokeWidth={2} aria-hidden="true" /> : <TriangleAlert size={18} strokeWidth={1.75} aria-hidden="true" />}
                  <span>{ok ? `Authorised for ${noun(s).plural}` : `Not listed for ${noun(s).plural}`}</span>
                </li>
              );
            })}
          </ul>

          {!check.ok && (
            <div className="notice notice--error" role="alert">
              <div>
                <p className="notice__title">Check with your vet or pharmacist before using it.</p>
                <p className="notice__text">
                  The UK register lists no products with this ingredient for {check.notAuthorisedFor.map((s) => noun(s).plural).join(" or ")}, and your household includes{" "}
                  {check.notAuthorisedFor.map((s) => noun(s).one).join(" and ")}. Check the label and ask your vet or pharmacist.
                </p>
              </div>
            </div>
          )}

          <h3 className="panel__title panel__title--sm">How products with it are supplied</h3>
          <ul className="plain-list">
            {Object.entries(chosen.categories)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, n]) => (
                <li key={cat}>
                  <strong>{CATEGORIES[cat]?.short ?? cat}</strong> ({n} {n === 1 ? "product" : "products"}). {CATEGORIES[cat]?.long}
                </li>
              ))}
          </ul>
          {chosen.otherSpecies.length > 0 && (
            <p className="muted">Also authorised for: {chosen.otherSpecies.slice(0, 8).join(", ")}{chosen.otherSpecies.length > 8 ? " and more" : ""}.</p>
          )}

          <p className="small">
            This shows what the UK register lists. It can&apos;t tell you whether something is safe for your pet, or what dose to give. Products with the same ingredient can differ in strength and in which animals they are for, so always check the label and ask your vet or pharmacist.
          </p>
          <p className="small">
            <a href="https://www.vmd.defra.gov.uk/ProductInformationDatabase/" target="_blank" rel="noopener noreferrer">
              Check the full register at the Veterinary Medicines Directorate
              <ExternalLink size={14} strokeWidth={1.5} aria-hidden="true" />
            </a>
          </p>
        </article>
      )}
    </div>
  );
}
