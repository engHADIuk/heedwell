// Takes the screenshots used in the README and saves them to docs/screenshots.
//
//   npm run build
//   npm run screenshots
//
// It starts the stand-in weather service (scripts/mock-services.mjs), so every
// picture uses the same SYNTHETIC weather and looks the same each time you run it.
// It also starts the built app on its own port, so it won't clash with `npm run dev`.
//
// It drives your installed Google Chrome. If you don't have Chrome, set CHROME_PATH to
// any Chromium-based browser, for example:
//   CHROME_PATH="/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" npm run screenshots
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = fileURLToPath(new URL("../docs/screenshots/", import.meta.url));
const APP_PORT = Number(process.env.SHOT_PORT ?? 3199);
const MOCK_PORT = Number(process.env.MOCK_PORT ?? 4010);
const BASE = `http://127.0.0.1:${APP_PORT}`;
const MOCK = `http://127.0.0.1:${MOCK_PORT}`;

if (!existsSync(new URL("../.next/BUILD_ID", import.meta.url))) {
  console.error("There's no production build yet. Run `npm run build` first, then `npm run screenshots`.");
  process.exit(1);
}

const children = [];
function run(cmd, args, env = {}) {
  const child = spawn(cmd, args, { cwd: root, env: { ...process.env, ...env }, stdio: "ignore" });
  children.push(child);
  return child;
}
const stopAll = () => children.forEach((c) => c.kill());
process.on("exit", stopAll);
process.on("SIGINT", () => process.exit(130));

async function waitFor(url, label) {
  for (let i = 0; i < 80; i++) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`${label} didn't start in time (${url})`);
}

// Two example pets. Biscuit is the plain case. Miso shows what happens when you use the "Other" boxes.
const BISCUIT = {
  postcode: "RG27 9XA",
  skipped: false,
  profile: { name: "Biscuit", species: "dog", age: "1to3", terrains: ["parks", "woodland", "fields"], habits: ["eatsGrass"], household: [] },
};
const MISO = {
  postcode: "RG27 9XA",
  skipped: false,
  profile: {
    name: "Miso",
    species: "cat",
    age: "other",
    ageNote: "About 5, a rescue",
    terrains: ["garden", "parks"],
    terrainNote: "A farm at weekends",
    habits: ["hunts"],
    habitNote: "Digs in compost",
    household: ["children"],
    householdNote: "A new baby due in March",
    symptoms: ["cough", "itching"],
    concerns: "Scratching more since Tuesday, and a small lump behind the left ear.",
  },
};

async function newPage(browser, { width = 1440, height = 900, mobile = false, saved = null } = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: mobile ? 2 : 1,
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  if (saved) await page.addInitScript((v) => localStorage.setItem("heedwell.v1", JSON.stringify(v)), saved);
  return page;
}

async function settle(page, ms = 700) {
  await page.waitForLoadState("load");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(ms);
}

async function launch() {
  const executablePath = process.env.CHROME_PATH;
  try {
    // Chrome refuses to start its sandbox when run as root, which only happens in containers.
    const args = process.getuid?.() === 0 ? ["--no-sandbox"] : [];
    return await chromium.launch(executablePath ? { executablePath, args } : { channel: "chrome", args });
  } catch (e) {
    console.error("Couldn't start Chrome. Install Google Chrome, or set CHROME_PATH to a Chromium-based browser.\n" + e.message);
    process.exit(1);
  }
}

await mkdir(out, { recursive: true });
run("node", ["scripts/mock-services.mjs"], { MOCK_PORT: String(MOCK_PORT) });
run("npx", ["next", "start", "-p", String(APP_PORT)], {
  POSTCODES_API_BASE: MOCK,
  OPEN_METEO_API_BASE: MOCK,
  NEXT_TELEMETRY_DISABLED: "1",
});
await waitFor(`${MOCK}/v1/forecast`, "The stand-in weather service");
await waitFor(`${BASE}/`, "The app");

const browser = await launch();
// JPEG keeps the repository small. The pages are mostly smooth gradients, which JPEG handles well.
const saveAs = (name) => ({ path: `${out}${name}.jpg`, type: "jpeg", quality: 88 });
const made = [];
const done = (name) => {
  made.push(name);
  console.log("  saved", name);
};

try {
  // 1. Home
  {
    const page = await newPage(browser);
    await page.goto(BASE + "/");
    await settle(page);
    await page.screenshot(saveAs("home"));
    done("home");

    const example = page.locator("section", { has: page.getByRole("heading", { name: "Try a week, right here" }) });
    await example.scrollIntoViewIfNeeded();
    await page.getByRole("radio", { name: /^Wednesday/ }).first().click();
    await page.waitForTimeout(400);
    await example.screenshot(saveAs("home-example-week"));
    done("home-example-week");
    await page.context().close();
  }

  // 2. Setting up a pet, with the "Other" boxes
  {
    const page = await newPage(browser, { saved: { postcode: "RG27 9XA", profile: null, skipped: false } });
    await page.goto(BASE + "/pet");
    await settle(page);
    await page.getByLabel("Their name").fill("Miso");
    await page.getByText("Cat", { exact: true }).first().click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByText("Other or not sure").click();
    await page.getByLabel("How old is your pet?").fill("About 5, a rescue");
    await page.waitForTimeout(300);
    await page.screenshot(saveAs("setup-age-other"));
    done("setup-age-other");
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByText("Somewhere else", { exact: true }).click();
    await page.getByLabel(/Where else does Miso go/).fill("A farm at weekends");
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByText("Itching or scratching").click();
    await page.getByText("Something else", { exact: true }).click();
    await page.getByLabel(/What have you seen in Miso/).fill("Scratching more since Tuesday, and a small lump behind the left ear.");
    await page.waitForTimeout(300);
    await page.screenshot(saveAs("setup-noticed"));
    done("setup-noticed");
    await page.context().close();
  }

  // 3. The plan
  {
    const page = await newPage(browser, { height: 1500, saved: BISCUIT });
    await page.goto(BASE + "/plan");
    await page.waitForSelector(".plan-top");
    await settle(page, 1000);
    await page.screenshot(saveAs("plan"));
    done("plan");
    await page.context().close();

    const why = await newPage(browser, { saved: BISCUIT });
    await why.goto(BASE + "/plan");
    await why.waitForSelector(".plan-top");
    await settle(why);
    await why.getByRole("button", { name: "Why this score" }).first().click();
    await why.waitForSelector("dialog[open]");
    await why.waitForTimeout(500);
    await why.screenshot(saveAs("plan-why"));
    done("plan-why");
    await why.context().close();
  }

  // 4. The vet summary
  {
    const page = await newPage(browser, { saved: MISO });
    await page.goto(BASE + "/summary");
    await page.waitForSelector(".sheet");
    await settle(page, 1000);
    await page.locator(".sheet").screenshot(saveAs("vet-summary"));
    done("vet-summary");
    await page.context().close();
  }

  // 5. The ingredient check
  {
    const page = await newPage(browser, { height: 1200 });
    await page.goto(BASE + "/medicines");
    await settle(page);
    await page.getByRole("button", { name: "Cats" }).click();
    await page.getByPlaceholder(/praziquantel/i).fill("praziquantel");
    await page.locator(".med-results li button").first().click();
    await page.waitForSelector(".med-card");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
    await page.screenshot(saveAs("ingredient-check"));
    done("ingredient-check");
    await page.context().close();
  }

  // 6. How it works
  {
    const page = await newPage(browser);
    await page.goto(BASE + "/how-it-works");
    await settle(page);
    await page.screenshot(saveAs("how-it-works"));
    done("how-it-works");
    await page.context().close();
  }

  // 7. On a phone
  {
    const home = await newPage(browser, { width: 390, height: 844, mobile: true });
    await home.goto(BASE + "/");
    await settle(home);
    await home.screenshot(saveAs("mobile-home"));
    done("mobile-home");
    await home.context().close();

    const plan = await newPage(browser, { width: 390, height: 844, mobile: true, saved: BISCUIT });
    await plan.goto(BASE + "/plan");
    await plan.waitForSelector(".plan-top");
    await settle(plan, 1000);
    await plan.screenshot(saveAs("mobile-plan"));
    done("mobile-plan");
    await plan.context().close();
  }
} finally {
  await browser.close();
  stopAll();
}

console.log(`\nDone. ${made.length} screenshots are in docs/screenshots.`);
process.exit(0);
