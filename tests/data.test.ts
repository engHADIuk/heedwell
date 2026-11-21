import { describe, expect, it } from "vitest";
import { GET as medicinesGET } from "@/app/api/medicines/route";
import { medicines } from "@/lib/medicines/data";
import { normaliseIngredient, searchIngredients, speciesCheck, type MedicineRecord } from "@/lib/medicines/match";
import { DEMO_PROFILE, sanitiseProfile } from "@/lib/profile";
import { decodeShare, encodeShare } from "@/lib/summary/share";
// Plain JavaScript helper shared with the ingest script.
import { aggregate, extractProducts, splitList } from "../scripts/lib/vmd.mjs";

const rec = (name: string, o: Partial<MedicineRecord> = {}): MedicineRecord => ({
  name,
  key: normaliseIngredient(name),
  dog: false,
  cat: false,
  otherSpecies: [],
  categories: {},
  products: 1,
  ...o,
});

describe("ingredient search", () => {
  const list = [
    rec("Fipronil", { dog: true, cat: true, products: 9 }),
    rec("Fipronil sulfone", { products: 1 }),
    rec("Praziquantel", { dog: true, cat: true, products: 30 }),
    rec("Permethrin", { dog: true, products: 5 }),
    rec("Milbemycin oxime", { dog: true, cat: true, products: 8 }),
  ];

  it("normalises names", () => {
    expect(normaliseIngredient("Milbemycin Oxime (A3 and A4)")).toBe("milbemycin oxime");
  });

  it("ranks exact, then prefix, then word, then contains", () => {
    expect(searchIngredients(list, "fipronil").map((r) => r.name)).toEqual(["Fipronil", "Fipronil sulfone"]);
    expect(searchIngredients(list, "oxime").map((r) => r.name)).toEqual(["Milbemycin oxime"]);
    expect(searchIngredients(list, "zi")[0].name).toBe("Praziquantel");
  });

  it("returns nothing for very short or unknown queries", () => {
    expect(searchIngredients(list, "f")).toEqual([]);
    expect(searchIngredients(list, "xyzzy")).toEqual([]);
  });

  it("flags species the ingredient isn't authorised for", () => {
    const permethrin = list[3];
    expect(speciesCheck(permethrin, ["dog"])).toEqual({ authorisedFor: ["dog"], notAuthorisedFor: [], ok: true });
    expect(speciesCheck(permethrin, ["dog", "cat"])).toEqual({ authorisedFor: ["dog"], notAuthorisedFor: ["cat"], ok: false });
  });

  it("serves results from the bundled file and never returns product names", async () => {
    const res = await medicinesGET(new Request("http://localhost/api/medicines?q=praz"));
    const body = await res.json();
    expect(body.meta.licence).toContain("Open Government Licence");
    expect(body.results[0].name).toBe("Praziquantel");
    expect(Object.keys(body.results[0]).sort()).toEqual(["categories", "cat", "dog", "key", "name", "otherSpecies", "products"].sort());
    expect(typeof medicines.meta.sample).toBe("boolean");
  });
});

describe("VMD ingest helpers", () => {
  it("splits lists on commas that are not inside brackets", () => {
    expect(splitList("Milbemycin Oxime (A3 and A4), Praziquantel")).toEqual(["Milbemycin Oxime (A3 and A4)", "Praziquantel"]);
    expect(splitList("Cefalexin (as monohydrate, equivalent to 100 mg), Prednisolone")).toEqual([
      "Cefalexin (as monohydrate, equivalent to 100 mg)",
      "Prednisolone",
    ]);
    expect(splitList("")).toEqual([]);
    expect(splitList(undefined)).toEqual([]);
  });

  const xml = `<?xml version="1.0"?>
  <VMD_PIDProducts>
    <CurrentAuthorisedProducts><VMDProductNo>A013214</VMDProductNo><Name>One</Name><ActiveSubstances>Milbemycin Oxime (A3 and A4), Praziquantel</ActiveSubstances><TargetSpecies>Dogs</TargetSpecies><DistributionCategory>POM-V</DistributionCategory></CurrentAuthorisedProducts>
    <CurrentAuthorisedProducts><VMDProductNo>A013217</VMDProductNo><Name>Two</Name><ActiveSubstances>Milbemycin Oxime (A3 and A4), Praziquantel</ActiveSubstances><TargetSpecies>Cats</TargetSpecies><DistributionCategory>POM-V</DistributionCategory></CurrentAuthorisedProducts>
    <CurrentAuthorisedProducts><VMDProductNo>A014424</VMDProductNo><Name>Three</Name><ActiveSubstances>Fenbendazole</ActiveSubstances><TargetSpecies>Pigs, Rabbits</TargetSpecies><DistributionCategory>POM-VPS</DistributionCategory></CurrentAuthorisedProducts>
    <CurrentAuthorisedProducts><VMDProductNo>A010811</VMDProductNo><Name>Four</Name><ActiveSubstances>Benazepril Hydrochloride</ActiveSubstances><TargetSpecies>Cats, Dogs</TargetSpecies><DistributionCategory>POM-V</DistributionCategory></CurrentAuthorisedProducts>
  </VMD_PIDProducts>`;

  it("finds products wherever they sit in the XML", () => {
    const products = extractProducts(xml);
    expect(products).toHaveLength(4);
    expect(products[2]).toMatchObject({ substances: ["Fenbendazole"], species: ["pigs", "rabbits"], categories: ["POM-VPS"] });
  });

  it("combines products into one record per active ingredient", () => {
    const list = aggregate(extractProducts(xml)) as unknown as MedicineRecord[];
    const byKey = Object.fromEntries(list.map((r) => [r.key, r]));
    expect(byKey["milbemycin oxime"]).toMatchObject({ name: "Milbemycin oxime", dog: true, cat: true, products: 2, categories: { "POM-V": 2 } });
    expect(byKey["fenbendazole"]).toMatchObject({ dog: false, cat: false, otherSpecies: ["pigs", "rabbits"], products: 1 });
    expect(byKey["benazepril hydrochloride"]).toMatchObject({ dog: true, cat: true });
  });
});

describe("profile and share link", () => {
  it("cleans untrusted profiles", () => {
    const p = sanitiseProfile({ name: "  <b>Zoë</b>\u0007 ", species: "cat", age: "1to3", terrains: ["parks", "moon"], habits: ["eatsSlugs", "hunts"], household: ["children", 5] });
    expect(p).toEqual({ name: "bZoë/b", species: "cat", age: "1to3", terrains: ["parks"], habits: ["hunts"], household: ["children"] });
    expect(sanitiseProfile({ name: "", species: "dog", age: "1to3" })).toBeNull();
    expect(sanitiseProfile({ name: "Rex", species: "rabbit", age: "1to3" })).toBeNull();
    expect(sanitiseProfile("nope")).toBeNull();
  });

  it("round-trips a profile through a link, including non-English letters", () => {
    const profile = { ...DEMO_PROFILE, name: "Zoë Åsa" };
    const text = encodeShare({ v: 1, outcode: "RG27", profile });
    expect(text).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeShare(text)).toEqual({ v: 1, outcode: "RG27", profile });
  });

  it("rejects links that are damaged, oversized or tampered with", () => {
    expect(decodeShare("%%%")).toBeNull();
    expect(decodeShare(null)).toBeNull();
    expect(decodeShare("a".repeat(3000))).toBeNull();
    const bad = encodeShare({ v: 1, outcode: "NOPE", profile: DEMO_PROFILE });
    expect(decodeShare(bad)).toBeNull();
    const tampered = encodeShare({ v: 1, outcode: "RG27", profile: { ...DEMO_PROFILE, species: "horse" as never } });
    expect(decodeShare(tampered)).toBeNull();
  });
});
