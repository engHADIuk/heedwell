import { describe, expect, it } from "vitest";
import { CONCERNS_MAX, NOTE_MAX, sanitiseProfile } from "@/lib/profile";
import { decodeShare, encodeShare } from "@/lib/summary/share";
import { hasNotes, hasUrgentSigns } from "@/lib/symptoms";
import { ageLabel } from "@/lib/copy";

const base = { name: "Miso", species: "cat", age: "1to3", terrains: [], habits: [], household: [] };

describe("owner notes and symptoms", () => {
  it("keeps notes, trims them and strips markup and control characters", () => {
    const p = sanitiseProfile({
      ...base,
      terrainNote: "  a <b>farm</b>\u0007   and a riverbank ",
      habitNote: "digs in compost",
      householdNote: "a new baby",
      concerns: "Scratching more since Tuesday",
    });
    expect(p?.terrainNote).toBe("a b farm /b and a riverbank");
    expect(p?.terrainNote).not.toMatch(/[<>\u0000-\u001f]/);
    expect(p?.habitNote).toBe("digs in compost");
    expect(p?.householdNote).toBe("a new baby");
    expect(p?.concerns).toBe("Scratching more since Tuesday");
  });

  it("cuts long notes to the limit and drops empty ones", () => {
    const p = sanitiseProfile({ ...base, terrainNote: "x".repeat(500), habitNote: "   ", concerns: "y".repeat(900) });
    expect(p?.terrainNote).toHaveLength(NOTE_MAX);
    expect(p?.habitNote).toBeUndefined();
    expect(p?.concerns).toHaveLength(CONCERNS_MAX);
  });

  it("accepts an age written in the owner's own words", () => {
    const p = sanitiseProfile({ ...base, age: "other", ageNote: "12 weeks old" });
    expect(p?.age).toBe("other");
    expect(ageLabel(p!)).toBe("12 weeks old");
    expect(sanitiseProfile({ ...base, age: "ancient" })).toBeNull();
  });

  it("only keeps symptoms it knows about", () => {
    const p = sanitiseProfile({ ...base, symptoms: ["cough", "itching", "dragon-breath", 7] });
    expect(p?.symptoms).toEqual(["cough", "itching"]);
    expect(sanitiseProfile(base)?.symptoms).toBeUndefined();
  });

  it("flags urgent signs from ticked boxes and from the owner's words", () => {
    expect(hasUrgentSigns(sanitiseProfile({ ...base, symptoms: ["cough"] }))).toBe(false);
    expect(hasUrgentSigns(sanitiseProfile({ ...base, symptoms: ["breathing"] }))).toBe(true);
    expect(hasUrgentSigns(sanitiseProfile({ ...base, symptoms: ["bleeding"] }))).toBe(true);
    expect(hasUrgentSigns(sanitiseProfile({ ...base, concerns: "She had a fit this morning" }))).toBe(true);
    expect(hasUrgentSigns(sanitiseProfile({ ...base, concerns: "Gasping for air at night" }))).toBe(true);
    expect(hasUrgentSigns(sanitiseProfile({ ...base, concerns: "A bit itchy behind the ears" }))).toBe(false);
    expect(hasUrgentSigns(null)).toBe(false);
  });

  it("knows when there is anything to show", () => {
    expect(hasNotes(sanitiseProfile(base))).toBe(false);
    expect(hasNotes(sanitiseProfile({ ...base, concerns: "limping" }))).toBe(true);
    expect(hasNotes(sanitiseProfile({ ...base, symptoms: ["tired"] }))).toBe(true);
  });

  it("carries notes through a share link and still rejects tampering", () => {
    const profile = sanitiseProfile({ ...base, symptoms: ["cough"], concerns: "Coughs after walks", terrainNote: "a farm" })!;
    const token = encodeShare({ v: 1, outcode: "RG27", profile });
    const back = decodeShare(token);
    expect(back?.profile.concerns).toBe("Coughs after walks");
    expect(back?.profile.symptoms).toEqual(["cough"]);
    expect(decodeShare(token.slice(0, -6) + "AAAAAA")).toBeNull();
  });
});
