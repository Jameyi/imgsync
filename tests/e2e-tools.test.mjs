// BDD (Gherkin) — T7: Playwright E2E per-tool main paths
// (behaviour sheet approved 2026-10-22, bodies per sheet)
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

// Playwright channel (SESSION.md): playwright resolved from the NetFlip
// node_modules; chromium kernel from PLAYWRIGHT_CHROMIUM (set per env or
// the SESSION.md default). Tests skip automatically when the dev server
// (BASE_URL, default http://localhost:6553) or the browser is unavailable.

const BASE_URL = process.env.BASE_URL ?? "http://localhost:6553";
const NETFLIP_MODULES = process.env.E2E_PLAYWRIGHT_MODULES ?? "";
const CHROMIUM_EXE = process.env.E2E_CHROMIUM_EXE ?? "";

let serverUp = false;
try {
  await fetch(`${BASE_URL}/`, { signal: AbortSignal.timeout(2000) });
  serverUp = true;
} catch {
  serverUp = false;
}

let chromium = null;
let executablePath;
try {
  const require = createRequire(NETFLIP_MODULES || import.meta.url);
  ({ chromium } = require(NETFLIP_MODULES ? "playwright" : "playwright"));
  executablePath = CHROMIUM_EXE || undefined;
  const probe = await chromium.launch({ executablePath });
  await probe.close();
} catch {
  chromium = null;
}

const E2E = {
  skip:
    serverUp && chromium
      ? false
      : `needs dev server at ${BASE_URL} + chromium (serverUp=${serverUp}, browser=${Boolean(chromium)})`,
};

const withPage = async (path, fn) => {
  const browser = await chromium.launch({ executablePath });
  try {
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });
    return await fn(page);
  } finally {
    await browser.close();
  }
};

// in-page canvas fixture: real, decodable PNG injected via DataTransfer
const uploadCanvasPNG = async (page, paint) => {
  await page.evaluate((paintFn) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext("2d");
      const paint = new Function("ctx", "w", "h", paintFn);
      paint(ctx, 320, 240);
      canvas.toBlob((blob) => {
        const file = new File([blob], "fixture.png", { type: "image/png" });
        const dt = new DataTransfer();
        dt.items.add(file);
        const input = document.querySelector('input[type="file"]');
        input.files = dt.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
        resolve();
      }, "image/png");
    });
  }, paint);
};

const downloadBytes = async (page, buttonSelector) => {
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 8000 }),
    page.locator(buttonSelector).first().click(),
  ]);
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return {
    bytes: Buffer.concat(chunks),
    suggested: download.suggestedFilename(),
  };
};

const isPNG = (bytes) =>
  bytes.length > 8 &&
  bytes[0] === 0x89 &&
  bytes[1] === 0x50 &&
  bytes[2] === 0x4e &&
  bytes[3] === 0x47;

const isJPEG = (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8;

test("F01 remove-white-background main path", E2E, async () => {
  await withPage("/tools/remove-white-background", async (page) => {
    await uploadCanvasPNG(
      page,
      `ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
       ctx.fillStyle = "#808080"; ctx.fillRect(90, 60, 140, 10);
       ctx.fillStyle = "#ff0000"; ctx.fillRect(90, 70, 140, 100);`,
    );
    await page.waitForTimeout(4000);
    const canvas = page.locator("canvas").first();
    assert.ok(await canvas.isVisible(), "result canvas rendered");
    const { bytes, suggested } = await downloadBytes(
      page,
      'button:has-text("Download PNG")',
    );
    assert.ok(isPNG(bytes), "download is a real PNG");
    assert.match(suggested, /\.png$/);
  });
});

test("F10 compress-to-size slider bounds and main path", E2E, async () => {
  await withPage("/tools/compress-to-size", async (page) => {
    await uploadCanvasPNG(
      page,
      `ctx.fillStyle = "#2060c0"; ctx.fillRect(0, 0, w, h);
       ctx.fillStyle = "#ffffff"; ctx.fillRect(100, 80, 120, 90);`,
    );
    await page.waitForTimeout(6000);
    const slider = page.locator('input[type="range"]').first();
    assert.ok(await slider.isVisible(), "bounded slider visible");
    const attrs = await slider.evaluate((el) => ({
      min: Number(el.min),
      max: Number(el.max),
      value: Number(el.value),
    }));
    assert.equal(attrs.min, 5, "slider floor is 5 KB");
    assert.ok(attrs.max > attrs.min, "max exceeds min (source-bound)");
    assert.ok(attrs.value >= attrs.min && attrs.value <= attrs.max);
    const { bytes, suggested } = await downloadBytes(
      page,
      'button:has-text("Download JPEG")',
    );
    assert.ok(isJPEG(bytes), "download is a real JPEG");
    assert.match(suggested, /\.jpe?g$/);
  });
});

test("F02 resize-to-preset free crop main path", E2E, async () => {
  await withPage("/tools/resize-to-preset", async (page) => {
    await uploadCanvasPNG(
      page,
      `ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
       ctx.fillStyle = "#2060c0"; ctx.fillRect(60, 50, 200, 150);`,
    );
    await page.waitForTimeout(3000);
    await page.locator('button:has-text("Free crop instead")').click();
    const img = page.locator("[data-crop-area] img").first();
    const box = await img.boundingBox();
    assert.ok(box, "preview image has a bounding box");
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx - 60, cy - 40);
    await page.mouse.down();
    await page.mouse.move(cx + 60, cy + 40, { steps: 8 });
    await page.mouse.up();
    await page.locator('button:has-text("Apply crop")').click();
    await page.waitForTimeout(800);
    const canvas = page.locator("canvas").first();
    assert.ok(await canvas.isVisible(), "crop preview canvas rendered");
    const { bytes, suggested } = await downloadBytes(
      page,
      'button:has-text("Download cropped PNG")',
    );
    assert.ok(isPNG(bytes), "crop download is a real PNG");
    assert.match(suggested, /crop-\d+x\d+\.png$/);
  });
});

test("F08 defringe-edges main path", E2E, async () => {
  await withPage("/tools/defringe-edges", async (page) => {
    await uploadCanvasPNG(
      page,
      `ctx.clearRect(0, 0, w, h);
       ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fillRect(95, 75, 10, 100);
       ctx.fillStyle = "#ff0000"; ctx.fillRect(100, 80, 120, 90);`,
    );
    await page.waitForTimeout(4000);
    const canvas = page.locator("canvas").first();
    assert.ok(await canvas.isVisible(), "result canvas rendered");
    const { bytes, suggested } = await downloadBytes(
      page,
      'button:has-text("Download PNG")',
    );
    assert.ok(isPNG(bytes), "download is a real PNG");
    assert.match(suggested, /\.png$/);
  });
});

test("F09 platform-preflight report cards", E2E, async () => {
  await withPage("/tools/platform-preflight", async (page) => {
    await uploadCanvasPNG(
      page,
      `ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
       ctx.fillStyle = "#ff0000"; ctx.fillRect(60, 50, 200, 150);`,
    );
    await page.waitForTimeout(3000);
    const workbench = page.locator("[data-workbench]").first();
    const text = await workbench.innerText();
    const cards = workbench.locator("li");
    const count = await cards.count();
    assert.ok(count >= 3, `expected >=3 report cards, got ${count}`);
    assert.match(text, /Subject-to-canvas ratio/i, "ratio check present");
    assert.match(text, /Minimum dimension/i, "dimension check present");
    assert.match(text, /File size/i, "file-size check present");
    assert.ok(
      text.includes("✅") || text.includes("❌"),
      "pass/fail verdicts rendered",
    );
  });
});
