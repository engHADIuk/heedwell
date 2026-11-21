import type { Species } from "@/lib/risk/types";

export interface MedicineRecord {
  /** Display name, for example "Milbemycin oxime". */
  name: string;
  /** Lower-case search key. */
  key: string;
  dog: boolean;
  cat: boolean;
  otherSpecies: string[];
  /** Count of authorised products by supply category, for example { "POM-V": 4 }. */
  categories: Record<string, number>;
  products: number;
}

export interface MedicinesFile {
  meta: {
    source: string;
    url: string;
    licence: string;
    generatedAt: string;
    /** True for the tiny demo file that ships with the repo. */
    sample: boolean;
    productCount: number;
  };
  ingredients: MedicineRecord[];
}

export function normaliseIngredient(text: string): string {
  return text
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Ranks by how closely the ingredient name matches what was typed. */
export function searchIngredients(list: MedicineRecord[], query: string, limit = 8): MedicineRecord[] {
  const q = normaliseIngredient(query);
  if (q.length < 2) return [];
  const ranked: { rec: MedicineRecord; rank: number }[] = [];
  for (const rec of list) {
    const rank =
      rec.key === q
        ? 0
        : rec.key.startsWith(q)
          ? 1
          : rec.key.split(/[\s-]/).some((w) => w.startsWith(q))
            ? 2
            : rec.key.includes(q)
              ? 3
              : -1;
    if (rank >= 0) ranked.push({ rec, rank });
  }
  ranked.sort((a, b) => a.rank - b.rank || b.rec.products - a.rec.products || a.rec.name.localeCompare(b.rec.name));
  return ranked.slice(0, limit).map((r) => r.rec);
}

export interface SpeciesCheck {
  authorisedFor: Species[];
  notAuthorisedFor: Species[];
  ok: boolean;
}

/** Compares an ingredient's authorised species with the animals in the home. */
export function speciesCheck(rec: MedicineRecord, home: Species[]): SpeciesCheck {
  const authorisedFor = home.filter((s) => rec[s]);
  const notAuthorisedFor = home.filter((s) => !rec[s]);
  return { authorisedFor, notAuthorisedFor, ok: notAuthorisedFor.length === 0 };
}
