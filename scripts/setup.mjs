// One command to fetch the real data this app uses:
//   - the full UK medicines register (replaces the 2-ingredient sample in data/medicines.json)
//   - the photographs (public/images)
//
//   npm run setup            fetches whatever is missing, and says what failed
//   npm run dev              runs this quietly first (--if-needed), and never blocks the server
import { readFile } from "node:fs/promises";
import { fetchPhotos } from "./fetch-photos.mjs";
import { ingest } from "./ingest-vmd.mjs";

const quiet = process.argv.includes("--if-needed");
const log = quiet ? () => {} : console.log;
const warn = (m) => console.warn(`[heedwell] ${m}`);

let problems = 0;

try {
  const current = JSON.parse(await readFile(new URL("../data/medicines.json", import.meta.url), "utf8"));
  if (current.meta?.sample) {
    if (quiet) console.log("[heedwell] Loading the UK medicines register (first run only)…");
    await ingest({ log });
  } else log("Medicines register already loaded.");
} catch (e) {
  problems++;
  warn(`Couldn't load the medicines register (${e.message}). The app will use the small sample. Try again with: npm run ingest`);
}

try {
  if (quiet) console.log("[heedwell] Checking photos…");
  const { failed } = await fetchPhotos({ log: quiet ? () => {} : console.log });
  if (failed.length) {
    problems++;
    warn(`${failed.length} photo(s) missing, so gradients are shown instead. Try again with: npm run photos`);
  }
} catch (e) {
  problems++;
  warn(`Couldn't fetch photos (${e.message}). Try again with: npm run photos`);
}

// Never stop the dev server over a download problem.
process.exit(quiet ? 0 : problems ? 1 : 0);
