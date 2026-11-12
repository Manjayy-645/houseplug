import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const label = process.env.HOUSEPLUG_CAPTURE_LABEL;
if (!/^(original|regressed|restored)$/.test(label || ""))
  throw Error("Explicit visual comparison label required");
const base = process.env.PLAYWRIGHT_BASE_URL;
if (new URL(base).hostname !== "127.0.0.1")
  throw Error("Local fixture server required");
const output = resolve("docs/evidence/visual-restoration");
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  args: ["--no-sandbox"],
});
const records = [];
try {
  for (const width of [375, 768, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    const css = [],
      failed = [],
      errors = [],
      consoleErrors = [];
    page.on("response", (r) => {
      if (r.request().resourceType() === "stylesheet")
        css.push({ url: r.url(), status: r.status() });
    });
    page.on("requestfailed", (r) =>
      failed.push({
        url: r.url(),
        type: r.resourceType(),
        error: r.failure()?.errorText,
      }),
    );
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") consoleErrors.push(m.text());
    });
    const response = await page.goto(base, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => {
      for (const image of document.images) image.loading = "eager";
    });
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 700) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await page.evaluate(() =>
      Promise.all([...document.images].map((i) => i.decode().catch(() => {}))),
    );
    await page.screenshot({
      path: resolve(output, `${label}-${width}.png`),
      fullPage: true,
    });
    const rendered = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: innerWidth,
      bodyFont: getComputedStyle(document.body).fontFamily,
      h1FontSize: getComputedStyle(document.querySelector("h1")).fontSize,
      h1Weight: getComputedStyle(document.querySelector("h1")).fontWeight,
      stylesheets: document.styleSheets.length,
      heroImage: [...document.images]
        .filter((i) => i.src.includes("hero-student-housing"))
        .map((i) => ({ width: i.naturalWidth, height: i.naturalHeight })),
      heading: document.querySelector("h1")?.textContent,
    }));
    records.push({
      label,
      width,
      httpStatus: response.status(),
      css,
      failed,
      errors,
      consoleErrors,
      ...rendered,
    });
    await page.close();
  }
  writeFileSync(
    resolve(output, `${label}-browser.json`),
    JSON.stringify(records, null, 2) + "\n",
  );
  console.log(JSON.stringify(records, null, 2));
} finally {
  await browser.close();
}
