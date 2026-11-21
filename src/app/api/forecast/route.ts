import { parsePostcode } from "@/lib/weather/postcode";
import { UpstreamError, defaultConfig, getForecast } from "@/lib/weather/upstream";

const CACHE = "public, s-maxage=1800, stale-while-revalidate=3600";

const STATUS = {
  postcode_invalid: 400,
  postcode_not_found: 404,
  postcode_service_unavailable: 502,
  weather_unavailable: 502,
} as const;

function fail(code: keyof typeof STATUS, message: string) {
  return Response.json({ code, message }, { status: STATUS[code], headers: { "Cache-Control": "no-store" } });
}

/**
 * GET /api/forecast?postcode=RG27%209XA
 * Looks up the postcode, then returns the past week and the week ahead as daily weather.
 * It never receives or stores anything about the pet.
 */
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("postcode") ?? "";
  const parsed = parsePostcode(raw);
  if (!parsed) return fail("postcode_invalid", "Enter a UK postcode, for example RG27 9XA.");

  try {
    const forecast = await getForecast(parsed, defaultConfig());
    return Response.json(forecast, { headers: { "Cache-Control": CACHE } });
  } catch (error) {
    if (error instanceof UpstreamError) return fail(error.code, error.message);
    return fail("weather_unavailable", "Something went wrong getting the weather.");
  }
}
