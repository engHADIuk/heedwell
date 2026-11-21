// Downloads the photos listed in data/photos.json from Unsplash (free under the Unsplash License)
// into public/images. Credits are in ATTRIBUTIONS.md and on the "How it works" page.
//
//   npm run photos            (only fetches what is missing)
//   npm run photos -- --force (fetches everything again)
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = new URL("../", import.meta.url);
const exists = (p) => access(p).then(() => true, () => false);

export async function fetchPhotos({ force = false, log = console.log } = {}) {
  const list = JSON.parse(await readFile(new URL("data/photos.json", ROOT), "utf8"));
  const dir = fileURLToPath(new URL("public/images/", ROOT));
  await mkdir(dir, { recursive: true });
  let ok = 0;
  const failed = [];
  for (const p of list) {
    const target = `${dir}${p.file}.jpg`;
    if (!force && (await exists(target))) {
      ok++;
      continue;
    }
    const url = `https://images.unsplash.com/${p.id}?auto=format&fit=crop&w=1600&q=75&fm=jpg`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      const type = res.headers.get("content-type") ?? "";
      if (!res.ok || !type.startsWith("image/")) throw new Error(`status ${res.status}, type ${type || "unknown"}`);
      const bytes = Buffer.from(await res.arrayBuffer());
      if (bytes.length < 10_000) throw new Error("file is too small to be a photo");
      await writeFile(target, bytes);
      log(`  ${p.file}.jpg  ${(bytes.length / 1024).toFixed(0)} KB  (${p.photographer})`);
      ok++;
    } catch (e) {
      failed.push(p.file);
      log(`  ${p.file}.jpg  could not download (${e.message}). The app shows a gradient instead.`);
    }
  }
  log(`Photos: ${ok} of ${list.length} ready.`);
  return { ok, failed };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  fetchPhotos({ force: process.argv.includes("--force") }).then((r) => process.exit(r.failed.length ? 1 : 0));
}
