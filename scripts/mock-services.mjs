// A tiny stand-in for postcodes.io and Open-Meteo, for working offline and for automated screenshots.
// The numbers are SYNTHETIC. Heedwell never uses this unless you point it here on purpose:
//
//   node scripts/mock-services.mjs &
//   POSTCODES_API_BASE=http://127.0.0.1:4010 OPEN_METEO_API_BASE=http://127.0.0.1:4010 npm run dev
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_PORT ?? 4010);

const PLACES = {
  "RG27 9XA": { postcode: "RG27 9XA", outcode: "RG27", latitude: 51.2879, longitude: -0.9632, parish: "Hook", admin_district: "Hart", admin_county: "Hampshire", region: "South East", country: "England" },
  "SW1A 1AA": { postcode: "SW1A 1AA", outcode: "SW1A", latitude: 51.501, longitude: -0.1416, parish: "unparished area", admin_district: "Westminster", admin_county: null, region: "London", country: "England" },
};
const OUTCODES = { RG27: { outcode: "RG27", latitude: 51.2879, longitude: -0.9632, parish: ["Hook"], admin_district: ["Hart"], admin_county: ["Hampshire"], country: ["England"] } };

const londonDate = (offsetDays) => {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
};

function weather() {
  const time = [];
  const temperature_2m = [];
  const relative_humidity_2m = [];
  const precipitation = [];
  const soil_moisture_0_to_7cm = [];
  const rainDays = new Set([-6, -5, -2, 3, 4, 6]);
  for (let i = -7; i <= 6; i++) {
    const mean = 8.5 + 1.8 * Math.sin(i / 3) + (i >= 3 ? 1.8 : 0);
    const rh = 79 + (i >= 3 ? 8 : 0) + 3 * Math.cos(i);
    for (let h = 0; h < 24; h++) {
      time.push(`${londonDate(i)}T${String(h).padStart(2, "0")}:00`);
      temperature_2m.push(+(mean + 3 * Math.sin(((h - 9) / 24) * 2 * Math.PI)).toFixed(1));
      relative_humidity_2m.push(Math.round(rh - 7 * Math.sin(((h - 9) / 24) * 2 * Math.PI)));
      precipitation.push(rainDays.has(i) && h >= 6 && h < 14 ? 0.5 : 0);
      soil_moisture_0_to_7cm.push(+(0.33 + (rainDays.has(i) ? 0.03 : 0)).toFixed(3));
    }
  }
  return { hourly: { time, temperature_2m, relative_humidity_2m, precipitation, soil_moisture_0_to_7cm } };
}

const send = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
};

createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const path = decodeURIComponent(url.pathname);
  if (path.startsWith("/postcodes/")) {
    const key = path.slice("/postcodes/".length).toUpperCase();
    return PLACES[key] ? send(res, 200, { status: 200, result: PLACES[key] }) : send(res, 404, { status: 404, error: "Postcode not found" });
  }
  if (path.startsWith("/outcodes/")) {
    const key = path.slice("/outcodes/".length).toUpperCase();
    return OUTCODES[key] ? send(res, 200, { status: 200, result: OUTCODES[key] }) : send(res, 404, { status: 404 });
  }
  if (path === "/v1/forecast") return send(res, 200, weather());
  send(res, 404, { error: "not found" });
}).listen(PORT, "127.0.0.1", () => console.log(`Mock weather services on http://127.0.0.1:${PORT} (synthetic data)`));
