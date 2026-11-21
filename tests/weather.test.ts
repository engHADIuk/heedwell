import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/forecast/route";
import { aggregateDaily, todayInLondon } from "@/lib/weather/aggregate";
import { parsePostcode } from "@/lib/weather/postcode";
import { addDays } from "./helpers";

describe("parsePostcode", () => {
  it("tidies full postcodes", () => {
    expect(parsePostcode("rg27 9xa")).toEqual({ kind: "full", value: "RG27 9XA", outcode: "RG27" });
    expect(parsePostcode("RG279XA")).toEqual({ kind: "full", value: "RG27 9XA", outcode: "RG27" });
    expect(parsePostcode(" sw1a  1aa ")?.value).toBe("SW1A 1AA");
    expect(parsePostcode("E1 6AN")?.value).toBe("E1 6AN");
    expect(parsePostcode("m1 1ae")?.value).toBe("M1 1AE");
  });

  it("accepts just the first half", () => {
    expect(parsePostcode("rg27")).toEqual({ kind: "outcode", value: "RG27", outcode: "RG27" });
    expect(parsePostcode("SW1A")?.kind).toBe("outcode");
  });

  it("rejects things that are not postcodes", () => {
    for (const bad of ["", "hello", "12345", "RG27 9X", "RG27 9XAA", "<script>", "A"]) {
      expect(parsePostcode(bad), bad).toBeNull();
    }
  });
});

function hourly(startDate: string, days: number) {
  const time: string[] = [];
  const temperature_2m: (number | null)[] = [];
  const relative_humidity_2m: (number | null)[] = [];
  const precipitation: (number | null)[] = [];
  const soil_moisture_0_to_7cm: (number | null)[] = [];
  for (let d = 0; d < days; d++) {
    for (let h = 0; h < 24; h++) {
      time.push(`${addDays(startDate, d)}T${String(h).padStart(2, "0")}:00`);
      temperature_2m.push(8 + (h >= 12 ? 4 : 0));
      relative_humidity_2m.push(80);
      precipitation.push(h === 6 ? 1 : 0);
      soil_moisture_0_to_7cm.push(0.3);
    }
  }
  return { time, temperature_2m, relative_humidity_2m, precipitation, soil_moisture_0_to_7cm };
}

describe("aggregateDaily", () => {
  it("reduces hourly readings to one row per day", () => {
    const days = aggregateDaily(hourly("2026-11-20", 2));
    expect(days).toHaveLength(2);
    expect(days[0]).toEqual({
      date: "2026-11-20",
      tempMean: 10,
      tempMax: 12,
      tempMin: 8,
      humidityMean: 80,
      precipSum: 1,
      soilMoisture: 0.3,
    });
  });

  it("copes with missing readings and drops thin days", () => {
    const h = hourly("2026-11-20", 2);
    for (let i = 24; i < 48; i++) if (i % 2 === 0) h.temperature_2m[i] = null; // day 2 keeps only 12
    for (let i = 0; i < 24; i++) h.soil_moisture_0_to_7cm[i] = null;
    const days = aggregateDaily(h);
    expect(days[0].soilMoisture).toBeNull();
    expect(days).toHaveLength(2);
    for (let i = 24; i < 48; i++) h.temperature_2m[i] = null; // now day 2 has none
    expect(aggregateDaily(h)).toHaveLength(1);
  });

  it("reads today's date in UK time", () => {
    expect(todayInLondon(new Date("2026-06-30T23:30:00Z"))).toBe("2026-07-01"); // BST
    expect(todayInLondon(new Date("2026-12-01T00:10:00Z"))).toBe("2026-12-01");
  });
});

describe("GET /api/forecast", () => {
  afterEach(() => vi.unstubAllGlobals());

  const call = (postcode: string) => GET(new Request(`http://localhost/api/forecast?postcode=${encodeURIComponent(postcode)}`));

  function stub(handlers: { postcodes?: () => Response; weather?: () => Response }) {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).includes("/postcodes/") || String(url).includes("/outcodes/")) {
          return handlers.postcodes ? handlers.postcodes() : Response.json({ status: 200, result: { postcode: "RG27 9XA", latitude: 51.28, longitude: -0.96, parish: "Hook", admin_district: "Hart", admin_county: "Hampshire", region: "South East" } });
        }
        return handlers.weather ? handlers.weather() : Response.json({ hourly: hourly(addDays(todayInLondon(), -7), 14) });
      }),
    );
  }

  it("returns a normalised week for a real-looking postcode", async () => {
    stub({});
    const res = await call("rg27 9xa");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.place).toMatchObject({ postcode: "RG27 9XA", outcode: "RG27", label: "Hook, Hampshire" });
    expect(body.days).toHaveLength(14);
    expect(body.todayIndex).toBe(7);
    expect(body.source).toBe("Open-Meteo");
    expect(res.headers.get("cache-control")).toContain("s-maxage=1800");
  });

  it("asks the outcode endpoint when only the first half is given", async () => {
    stub({ postcodes: () => Response.json({ status: 200, result: { outcode: "RG27", latitude: 51.28, longitude: -0.96, parish: ["Hook"], admin_district: ["Hart"], admin_county: ["Hampshire"] } }) });
    const res = await call("RG27");
    expect(res.status).toBe(200);
    expect((await res.json()).place.label).toBe("Hook, Hampshire");
    expect(String((vi.mocked(fetch).mock.calls[0] as unknown[])[0])).toContain("/outcodes/RG27");
  });

  it("returns 400 for something that is not a postcode, without calling anyone", async () => {
    stub({});
    const res = await call("not a postcode");
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("postcode_invalid");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns 404 when the postcode doesn't exist", async () => {
    stub({ postcodes: () => new Response("{}", { status: 404 }) });
    const res = await call("ZZ99 9ZZ");
    expect(res.status).toBe(404);
    expect((await res.json()).code).toBe("postcode_not_found");
  });

  it("returns 502 when the weather service fails", async () => {
    stub({ weather: () => new Response("nope", { status: 500 }) });
    const res = await call("RG27 9XA");
    expect(res.status).toBe(502);
    expect((await res.json()).code).toBe("weather_unavailable");
  });

  it("returns 502 when the weather service sends too little", async () => {
    stub({ weather: () => Response.json({ hourly: hourly(addDays(todayInLondon(), -1), 2) }) });
    const res = await call("RG27 9XA");
    expect(res.status).toBe(502);
  });

  it("returns 502 when the network drops", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    const res = await call("RG27 9XA");
    expect(res.status).toBe(502);
    expect((await res.json()).code).toBe("postcode_service_unavailable");
  });
});
