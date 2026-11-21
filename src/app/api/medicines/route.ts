import { medicines } from "@/lib/medicines/data";
import { searchIngredients } from "@/lib/medicines/match";

/**
 * GET /api/medicines?q=fipronil
 * Searches active ingredients only. Product names are never returned.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const results = searchIngredients(medicines.ingredients, q.slice(0, 60));
  return Response.json(
    { meta: medicines.meta, results },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
