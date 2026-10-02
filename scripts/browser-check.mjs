import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve, extname } from "node:path";
import assert from "node:assert/strict";
import { measureContrast } from "./contrast.mjs";
const require = createRequire(
  process.env.TOOLCHAIN_ROOT
    ? `${process.env.TOOLCHAIN_ROOT}/package.json`
    : import.meta.url,
);
const { chromium } = require("playwright");
const root = resolve("dist");
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, "http://local").pathname);
    if (!path.startsWith("/preview/")) {
      res.writeHead(404);
      res.end();
      return;
    }
    const file = resolve(root, path.slice(9) || "index.html");
    if (!file.startsWith(root + "/")) {
      res.writeHead(403);
      res.end();
      return;
    }
    res.writeHead(200, {
      "Content-Type": mime[extname(file)] || "application/octet-stream",
    });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}/preview/`;
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {}),
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1080 },
  acceptDownloads: true,
});
const page = await context.newPage();
const errors = [];
const failures = [];
const checks = [];
const check = (name, value) => {
  assert.ok(value, name);
  checks.push(name);
  console.log(`PASS ${name}`);
};
page.on("pageerror", (e) => errors.push(e.message));
page.on("requestfailed", (r) => failures.push(r.url()));
page.on("response", (r) => {
  if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`);
});
const screenshots = "artifacts";
await mkdir(screenshots, { recursive: true });
try {
  await page.clock.install();
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  check(
    "export runs under /preview/ with both local fonts loaded",
    await page.evaluate(() =>
      [...document.fonts].every((f) => f.status === "loaded"),
    ),
  );
  await page.screenshot({path:`${screenshots}/welcome-desktop.png`,fullPage:true});
  await page.keyboard.press("Tab");
  check(
    "keyboard starts at skip link",
    await page
      .locator(".skip-link")
      .evaluate((el) => el === document.activeElement),
  );
  await page.keyboard.press("Enter");
  check(
    "skip link reaches game heading",
    await page
      .locator("#game-heading")
      .evaluate((el) => el === document.activeElement),
  );
  await page.locator("#username-form button").click();
  check(
    "empty username prevents play and focuses an announced error",
    (await page.locator("#username").getAttribute("aria-invalid")) === "true" &&
      (await page
        .locator("#username")
        .evaluate((el) => el === document.activeElement)),
  );
  await page.locator("#username").fill("<script>");
  await page.locator("#username-form button").click();
  check(
    "unsupported username characters are rejected",
    (await page.locator("#username").getAttribute("aria-invalid")) === "true",
  );
  await page.locator("#username").fill("pondlegend");
  check(
    "valid editing clears an earlier username error",
    (await page.locator("#username-error").textContent()) === "",
  );
  await page.locator("#username").press("Tab");
  await page.screenshot({
    path: `${screenshots}/keyboard-focus.png`,
    fullPage: true,
  });
  await page.keyboard.press("Enter");
  check(
    "username submission starts game with keyboard focus on flap control",
    await page
      .locator("#flap")
      .evaluate((el) => el === document.activeElement && !el.hidden),
  );
  await page.keyboard.press("p");
  check(
    "P pauses with a resume control",
    await page.locator("#resume").isVisible(),
  );
  await page.clock.runFor(5000);
  check(
    "paused game does not record a run",
    (await page.locator("#entry-count").textContent()) === "0 entries",
  );
  await page.keyboard.press("p");
  await page.clock.runFor(700);
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Space");
    await page.clock.runFor(665);
  }
  check(
    "keyboard flaps clear a real pipe and increment the rendered score",
    Number(await page.locator("#score").textContent()) >= 1,
  );
  await page.keyboard.press("p");
  await page.screenshot({
    path: `${screenshots}/paused-desktop.png`,
    fullPage: true,
  });
  await page.locator("#resume").click();
  await page.clock.runFor(2000);
  check(
    "collision displays result and saves exactly one completed run",
    (await page.locator("#retry").isVisible()) &&
      (await page.locator("#entry-count").textContent()) === "1 entry",
  );
  await page.clock.runFor(5000);
  check(
    "game over does not duplicate scores",
    (await page.locator("#entry-count").textContent()) === "1 entry",
  );
  await page.locator("#retry").click();
  await page.clock.runFor(2000);
  check(
    "retry records zero-score runs under the same username",
    (await page.locator("#entry-count").textContent()) === "2 entries" &&
      (await page
        .locator(".entry-score")
        .allTextContents()
        .then((scores) => scores.includes("0"))),
  );
  await page.reload();
  check(
    "reload retains all runs and asks for a username again",
    (await page.locator("#entry-count").textContent()) === "2 entries" &&
      (await page.locator("#username").isVisible()),
  );
  await page.locator("#username").fill("another pilot");
  await page.locator("#username-form button").click();
  await page.clock.runFor(2000);
  check(
    "a second player keeps the first player’s runs",
    (await page.locator("#entry-count").textContent()) === "3 entries" &&
      (await page
        .locator("tbody")
        .textContent()
        .then((t) => t.includes("another pilot") && t.includes("pondlegend"))),
  );
  await page.locator("#change-player").click();
  check(
    "change player returns focus to username",
    await page
      .locator("#username")
      .evaluate((el) => el === document.activeElement),
  );
  const other = await context.newPage();
  await other.goto(url);
  await other.evaluate(() => {
    for (let i = 0; i < 6; i++) {
      const e = {
        id: `fixture-${i}`,
        username: `test pilot ${i}`,
        score: 10 + i,
        date: `2026-10-01T12:0${i}:00.000Z`,
        duration: 10,
      };
      localStorage.setItem(`flappy-pepe:run:${e.id}`, JSON.stringify(e));
    }
  });
  await other.close();
  await page.waitForFunction(
    () => document.querySelector("#entry-count").textContent === "9 entries",
  );
  check(
    "new runs in another tab appear without losing previous entries",
    (await page.locator("#entry-count").textContent()) === "9 entries",
  );
  check(
    "highest-score sort puts best run first",
    (await page.locator(".entry-score").first().textContent()) === "15",
  );
  await page.locator("#next").click();
  check(
    "pagination reaches every entry",
    (await page.locator("#page-count").textContent()) === "2 of 2" &&
      (await page.locator("tbody tr").count()) === 4,
  );
  await page.locator("#sort").selectOption("recent");
  check(
    "latest sort resets pagination and sorts dates",
    (await page.locator("#page-count").textContent()) === "1 of 2" &&
      (await page
        .locator(".pilot-name")
        .first()
        .textContent()
        .then((t) => t.includes("another pilot"))),
  );
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#download").click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let csv = "";
  for await (const chunk of stream) csv += chunk;
  check(
    "CSV downloads all 9 attempts across pages",
    csv.trim().split("\r\n").length === 10 &&
      download.suggestedFilename() === "flappy-pepe-scores.csv",
  );
  await page.locator("#sound").click();
  check(
    "sound toggle announces enabled state",
    (await page.locator("#sound").getAttribute("aria-pressed")) === "true",
  );
  await page.locator("#sound").click();
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  const audits = [];
  const contrasts = [];
  for (const width of [1440, 820, 390, 320]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1080 : 844 });
    check(
      `no horizontal overflow at ${width}px`,
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    const pairs = await page.evaluate(measureContrast);
    contrasts.push({width,pairs});
    check(`rendered text contrast meets 4.5:1 at ${width}px`,pairs.every(p=>p.contrast>=4.5));
    const audit = await page.evaluate(
      async () =>
        await axe.run(document, {
          runOnly: {
            type: "tag",
            values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
          },
        }),
    );
    audits.push({
      width,
      violations: audit.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    });
    if (width === 320 || width === 390)
      await page.screenshot({
        path: `${screenshots}/mobile-${width}.png`,
        fullPage: true,
      });
  }
  await writeFile(`${screenshots}/contrast-results.json`,JSON.stringify(contrasts,null,2)+"\n");
  await writeFile(
    `${screenshots}/accessibility-results.json`,
    JSON.stringify(audits, null, 2) + "\n",
  );
  check(
    "axe automated WCAG checks report zero violations at all four widths",
    audits.every((a) => a.violations.length === 0),
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  check(
    "reduced motion disables decorative control transitions",
    await page
      .locator(".primary-button")
      .evaluate((el) => getComputedStyle(el).transitionDuration === "0s"),
  );
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.locator("#sort").selectOption("score");
  await page.screenshot({ path: `${screenshots}/desktop.png`, fullPage: true });
  await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
  check(
    "200% text enlargement reflows without horizontal overflow",
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.evaluate(() => (document.documentElement.style.fontSize = ""));
  const failuresPage = await context.newPage();
  await failuresPage.addInitScript(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException("Quota reached", "QuotaExceededError");
    };
  });
  await failuresPage.clock.install();
  await failuresPage.goto(url);
  await failuresPage.locator("#username").fill("storage test");
  await failuresPage.locator("#username-form button").click();
  await failuresPage.clock.runFor(2000);
  check(
    "quota failure retains the run in memory and gives recovery instructions",
    (await failuresPage.locator("#storage-notice").isVisible()) &&
      (await failuresPage
        .locator("#storage-notice")
        .textContent()
        .then((t) => t.includes("Export all scores"))) &&
      (await failuresPage.locator("#entry-count").textContent()) ===
        "10 entries",
  );
  await failuresPage.close();
  const touchContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const touchPage = await touchContext.newPage();
  await touchPage.clock.install();
  await touchPage.goto(url);
  await touchPage.screenshot({path:`${screenshots}/welcome-mobile.png`,fullPage:true});
  await touchPage.locator("#username").fill("touch pilot");
  await touchPage.locator("#username-form button").tap();
  for (let i = 0; i < 3; i++) {
    await touchPage.clock.runFor(600);
    await touchPage.locator("#flap").tap();
  }
  check(
    "touch input keeps a mobile flight alive",
    (await touchPage.locator("#flap").isVisible()) &&
      (await touchPage.locator("#entry-count").textContent()) === "0 entries",
  );
  await touchContext.close();
  check(
    "no JavaScript errors or failed resources on production export",
    errors.length === 0 && failures.length === 0,
  );
  await writeFile(
    `${screenshots}/interaction-results.json`,
    JSON.stringify(
      {
        checks,
        errors,
        failedResources: failures,
        browser: await browser.version(),
        note: "Pagination and sorting checks use six explicit test fixtures; screenshots of populated boards contain these fixtures.",
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`Completed ${checks.length} browser checks.`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
