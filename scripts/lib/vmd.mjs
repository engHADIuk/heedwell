// Helpers for turning the VMD Product Information Database XML into data/medicines.json.
// Plain JavaScript so the ingest script runs with just `node`, no build step.
import { XMLParser } from "fast-xml-parser";

/** Splits "A (x, y), B" into ["A (x, y)", "B"]: commas inside brackets don't split. */
export function splitList(text) {
  if (typeof text !== "string") return [];
  const out = [];
  let depth = 0;
  let cur = "";
  for (const ch of text) {
    if (ch === "(") depth++;
    if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      if (cur.trim()) out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

export function normaliseKey(name) {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function displayName(name) {
  const clean = name.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

const asText = (v) => (typeof v === "string" || typeof v === "number" ? String(v) : "");

/** Walks the parsed XML and collects every element that looks like a product record. */
function collect(node, out) {
  if (Array.isArray(node)) return node.forEach((n) => collect(n, out));
  if (node && typeof node === "object") {
    if ("VMDProductNo" in node) {
      out.push({
        no: asText(node.VMDProductNo),
        substances: splitList(asText(node.ActiveSubstances)),
        species: splitList(asText(node.TargetSpecies)).map((s) => s.toLowerCase()),
        categories: splitList(asText(node.DistributionCategory)),
      });
    } else {
      Object.values(node).forEach((v) => collect(v, out));
    }
  }
}

export function extractProducts(xmlText) {
  const parser = new XMLParser({ ignoreAttributes: true, parseTagValue: false, trimValues: true });
  const out = [];
  collect(parser.parse(xmlText), out);
  return out;
}

/** One record per active ingredient, with the animals it is authorised for and how it is supplied. */
export function aggregate(products) {
  const map = new Map();
  for (const p of products) {
    for (const substance of p.substances) {
      const key = normaliseKey(substance);
      if (!key) continue;
      let rec = map.get(key);
      if (!rec) {
        rec = { name: displayName(substance), key, dog: false, cat: false, otherSpecies: new Set(), categories: {}, products: 0 };
        map.set(key, rec);
      }
      rec.products += 1;
      for (const s of p.species) {
        if (s === "dogs" || s === "dog") rec.dog = true;
        else if (s === "cats" || s === "cat") rec.cat = true;
        else if (s) rec.otherSpecies.add(s);
      }
      for (const c of p.categories) rec.categories[c] = (rec.categories[c] ?? 0) + 1;
    }
  }
  return [...map.values()]
    .map((r) => ({ ...r, otherSpecies: [...r.otherSpecies].sort() }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function buildFile(products, now = new Date()) {
  return {
    meta: {
      source: "Veterinary Medicines Directorate, Product Information Database",
      url: "https://www.vmd.defra.gov.uk/ProductInformationDatabase/",
      licence: "Open Government Licence v3.0",
      generatedAt: now.toISOString(),
      sample: false,
      productCount: products.length,
    },
    ingredients: aggregate(products),
  };
}
