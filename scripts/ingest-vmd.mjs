// Downloads the VMD Product Information Database (Open Government Licence v3.0)
// and writes data/medicines.json: one record per active ingredient, no product names.
//
//   npm run ingest
import { writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildFile, extractProducts } from "./lib/vmd.mjs";

export const VMD_URL = "https://www.vmd.defra.gov.uk/ProductInformationDatabase/downloads/VMD_ProductInformationDatabase.xml";
const OUT = fileURLToPath(new URL("../data/medicines.json", import.meta.url));

export async function ingest({ url = VMD_URL, out = OUT, log = console.log } = {}) {
  log(`Downloading ${url}`);
  const res = await fetch(url, {
    headers: { "user-agent": "heedwell-ingest (open-source portfolio project)" },
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`The VMD site answered ${res.status}.`);
  const xml = await res.text();
  log(`Got ${(xml.length / 1e6).toFixed(1)} million characters. Reading products…`);

  const products = extractProducts(xml);
  if (products.length < 500) {
    throw new Error(`Only found ${products.length} products. The file layout may have changed, so nothing was written.`);
  }
  const file = buildFile(products);
  await writeFile(out, JSON.stringify(file) + "\n");
  const dogs = file.ingredients.filter((i) => i.dog).length;
  const cats = file.ingredients.filter((i) => i.cat).length;
  log(`Wrote ${file.ingredients.length} active ingredients from ${products.length} products (${dogs} for dogs, ${cats} for cats).`);
  return file;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  ingest().catch((e) => {
    console.error(`Ingest failed: ${e.message}`);
    process.exit(1);
  });
}
