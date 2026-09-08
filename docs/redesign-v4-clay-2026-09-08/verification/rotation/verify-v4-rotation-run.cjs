/**
 * Independent real-browser regression for scroll/rotation ownership.
 * Run from the repository root after building and starting a production preview:
 *   node scripts/verify-v4-rotation.cjs
 *
 * Required tooling: Chrome, playwright-core, Python 3 with Pillow.
 * Overrides: SITE_URL, ROTATION_OUTPUT, PLAYWRIGHT_CORE, CHROME_PATH, PYTHON_PATH.
 * The Python interpreter is discovered without installing packages. A configured
 * PYTHON_PATH is authoritative; otherwise python3 and the local bundled runtime
 * are checked. All screenshots, model fingerprints and measurements are retained.
 */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

let chromium;
try { ({ chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core')); }
catch (error) {
  if (process.env.PLAYWRIGHT_CORE) throw error;
  ({ chromium } = require(path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core')));
}

const output = path.resolve(process.env.ROTATION_OUTPUT || 'docs/redesign-v4-clay-2026-09-08/verification/rotation');
const viewport = { width: 1440, height: 1000 };
// Second-chapter model area. Excludes the 80px header, right-hand copy (>778px),
// navigation at the right edge and controls below 900px. Coordinates are CSS px;
// deviceScaleFactor is fixed to 1 so these are also screenshot pixel coordinates.
const modelRegion = { x: 0, y: 100, width: 700, height: 800 };
const thresholds = {
  visiblyTurned: { minimumMeanDifference: 1, minimumChangedPixelFraction: .02 },
  returned: { maximumMeanDifference: .75, maximumChangedPixelFraction: .01 },
  repeatable: { maximumMeanDifference: .1, maximumChangedPixelFraction: .002 },
  changedPixelChannelThreshold: 5,
};
const report = {
  startedAt: new Date().toISOString(),
  url: process.env.SITE_URL || 'http://127.0.0.1:5175/',
  scope: 'Independent rotation-control regression against the actual loaded model. This test does not establish model-design acceptance.',
  viewport,
  modelRegion,
  thresholds,
  checks: [],
  screenshots: [],
  modelAssets: [],
  errors: [],
};
fs.mkdirSync(output, { recursive: true });

function check(name, condition, detail) {
  report.checks.push({ name, status: condition ? 'pass' : 'fail', detail });
  assert(condition, name);
  console.log('PASS', name);
}

function findPython() {
  const candidates = process.env.PYTHON_PATH ? [process.env.PYTHON_PATH] : [
    'python3',
    path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3'),
  ];
  for (const candidate of candidates) {
    try {
      execFileSync(candidate, ['-c', 'from PIL import Image'], { stdio: 'ignore' });
      return candidate;
    } catch { /* Check the next existing interpreter; never install dependencies. */ }
  }
  throw new Error('Python 3 with Pillow is required. Set PYTHON_PATH to an existing interpreter that provides Pillow.');
}

// Standard Python/Pillow comparison, embedded to keep this a single reusable file.
// PNG bytes are decoded to RGB; comparisons measure only the declared model ROI.
const pixelComparison = String.raw`
import json, sys
from pathlib import Path
from PIL import Image, ImageChops, ImageStat

config = json.load(sys.stdin)
root = Path(config['output'])
roi = config['modelRegion']
box = (roi['x'], roi['y'], roi['x'] + roi['width'], roi['y'] + roi['height'])
count = roi['width'] * roi['height']
threshold = config['threshold']
cache = {}

def crop(name):
    if name not in cache:
        with Image.open(root / name) as source:
            if source.size != (1440, 1000):
                raise ValueError('Unexpected canvas screenshot size for ' + name + ': ' + str(source.size))
            image = source.convert('RGB').crop(box)
        cache[name] = image
        image.save(root / (Path(name).stem + '-model-region.png'))
    return cache[name]

results = []
for pair in config['pairs']:
    difference = ImageChops.difference(crop(pair['a']), crop(pair['b']))
    stats = ImageStat.Stat(difference)
    changed = sum(1 for pixel in difference.getdata() if max(pixel) > threshold)
    result = dict(pair)
    result.update({
        'region': roi,
        'meanAbsoluteChannelDifference': sum(stats.mean) / 3,
        'changedPixelFractionAboveThreshold': changed / count,
        'exactlyEqual': difference.getbbox() is None,
    })
    difference.save(root / (pair['name'] + '-model-difference.png'))
    results.append(result)
print(json.dumps(results))
`;

let browser;
(async () => {
  const python = findPython();
  report.python = python;
  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
  });
  report.browser = await browser.version();
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
  const modelResponses = [];
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400) report.errors.push(`${response.status()} ${response.url()}`);
    if (/\.glb(?:[?#]|$)/i.test(response.url())) modelResponses.push(response);
  });
  await page.addInitScript(() => {
    window.__rotationDraws = 0;
    for (const Type of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
      if (!Type) continue;
      for (const name of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
        const original = Type.prototype[name];
        if (typeof original !== 'function') continue;
        Type.prototype[name] = function (...args) {
          window.__rotationDraws++;
          return original.apply(this, args);
        };
      }
    }
  });

  async function settle(timeout = 15000) {
    const started = Date.now();
    let previous = -1;
    let stableSamples = 0;
    while (Date.now() - started < timeout) {
      await page.waitForTimeout(250);
      const draws = await page.evaluate(() => window.__rotationDraws);
      stableSamples = draws === previous ? stableSamples + 1 : 0;
      if (stableSamples >= 2) return { draws, waitedMs: Date.now() - started };
      previous = draws;
    }
    throw new Error('Rendering did not settle within 15 seconds; continuous drawing or a stalled interaction remains.');
  }

  async function jump(index) {
    // DOM activation keeps the physical pointer fixed, preventing micro-parallax
    // from contaminating image comparisons. It invokes the real UI click handler.
    await page.locator('.cinema-chapters button').nth(index).evaluate(button => button.click());
  }

  async function turn(count = 1) {
    for (let i = 0; i < count; i++) {
      await page.locator('.cinema-view-control').evaluate(button => button.click());
      await page.waitForTimeout(70);
    }
  }

  async function capture(name) {
    const settled = await settle();
    await page.locator('canvas').screenshot({ path: path.join(output, `${name}.png`) });
    const state = await page.evaluate(() => ({
      scrollY: window.scrollY,
      activeChapter: [...document.querySelectorAll('.cinema-chapters button')].findIndex(button => button.getAttribute('aria-current') === 'step'),
      draws: window.__rotationDraws,
    }));
    report.screenshots.push({ file: `${name}.png`, state, settled });
    check(`${name}: second chapter reached`, state.activeChapter === 1, state);
    return state;
  }

  const response = await page.goto(report.url, { waitUntil: 'networkidle', timeout: 90000 });
  report.documentStatus = response?.status();
  await page.locator('.cinema-copy.copy-0 h1').waitFor();
  await page.locator('.cinema-loading').waitFor({ state: 'hidden', timeout: 90000 });
  await page.waitForFunction(() => {
    const canvas = document.querySelector('canvas');
    return canvas && canvas.width > 0 && canvas.height > 0;
  });
  check('One canvas, four chapters and no visible static fallback',
    await page.locator('canvas').count() === 1 &&
    await page.locator('.cinema-chapters button').count() === 4 &&
    await page.locator('.cinema-fallback:visible').count() === 0);
  for (const modelResponse of modelResponses) {
    const fingerprintResponse = await page.request.get(modelResponse.url());
    assert.equal(fingerprintResponse.status(), modelResponse.status(), 'Observed asset URL must return the same successful HTTP status');
    const bytes = await fingerprintResponse.body();
    report.modelFingerprintMethod = 'Independent full HTTP GET to the actual GLB response URL observed in the browser; used because Chrome inspector cache evicted the 29MB response body. Screenshot and interaction checks still execute in the same real page.';
    report.modelAssets.push({
      url: modelResponse.url(),
      status: modelResponse.status(),
      bytes: bytes.length,
      sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    });
  }
  check('Actual GLB response fingerprint recorded', report.modelAssets.length > 0, report.modelAssets);
  await page.mouse.move(viewport.width / 2, viewport.height / 2);
  await settle();

  await jump(1);
  await capture('second-baseline');
  await jump(0);
  await settle();
  report.rotationDuringScroll = await page.evaluate(() => new Promise((resolve, reject) => {
    const cinema = document.querySelector('.cinema');
    const target = cinema.getBoundingClientRect().top + window.scrollY + (cinema.offsetHeight - window.innerHeight) * .30;
    const origin = window.scrollY;
    const started = performance.now();
    document.querySelectorAll('.cinema-chapters button')[1].click();
    const attempt = () => {
      const now = window.scrollY;
      if (now > origin + 1 && now < target - 20) {
        document.querySelector('.cinema-view-control').click();
        resolve({ origin, target, scrollYAtRotation: now, elapsedMs: performance.now() - started });
      } else if (performance.now() - started > 5000 || now >= target - 20) {
        reject(new Error('Could not activate rotation while the chapter scroll was still in progress.'));
      } else requestAnimationFrame(attempt);
    };
    requestAnimationFrame(attempt);
  }));
  await capture('second-race-rotated');
  await turn(3);
  await capture('second-race-four-turns');

  await jump(0);
  await settle();
  await jump(1);
  await capture('second-stationary-baseline');
  await turn();
  await capture('second-stationary-one-turn');
  await turn(3);
  await capture('second-stationary-four-turns');

  await turn();
  await capture('second-before-scroll-reset');
  await page.evaluate(() => window.scrollBy({ top: 180, behavior: 'smooth' }));
  await settle();
  await jump(1);
  await capture('second-scroll-restored');
  const before = await page.evaluate(() => window.__rotationDraws);
  await page.waitForTimeout(700);
  const after = await page.evaluate(() => window.__rotationDraws);
  check('Settled scene performs zero additional draw calls over 700ms', before === after, { before, after });

  const pairs = [
    { name: 'race-preserves-turn', a: 'second-baseline.png', b: 'second-race-rotated.png', expectation: 'turned' },
    { name: 'race-four-returns', a: 'second-baseline.png', b: 'second-race-four-turns.png', expectation: 'returned' },
    { name: 'stationary-turns', a: 'second-stationary-baseline.png', b: 'second-stationary-one-turn.png', expectation: 'turned' },
    { name: 'stationary-four-returns', a: 'second-stationary-baseline.png', b: 'second-stationary-four-turns.png', expectation: 'returned' },
    { name: 'scroll-restores', a: 'second-stationary-baseline.png', b: 'second-scroll-restored.png', expectation: 'returned' },
    { name: 'baseline-repeatability', a: 'second-baseline.png', b: 'second-stationary-baseline.png', expectation: 'repeatable' },
  ];
  report.pixelComparisons = JSON.parse(execFileSync(python, ['-c', pixelComparison], {
    input: JSON.stringify({ output, modelRegion, pairs, threshold: thresholds.changedPixelChannelThreshold }),
    encoding: 'utf8',
    maxBuffer: 2 * 1024 * 1024,
  }));
  fs.writeFileSync(path.join(output, 'pixel-comparisons.json'), JSON.stringify(report.pixelComparisons, null, 2) + '\n');
  for (const comparison of report.pixelComparisons) {
    let passed;
    if (comparison.expectation === 'turned') {
      passed = comparison.meanAbsoluteChannelDifference > thresholds.visiblyTurned.minimumMeanDifference &&
        comparison.changedPixelFractionAboveThreshold > thresholds.visiblyTurned.minimumChangedPixelFraction;
    } else {
      const tolerance = thresholds[comparison.expectation];
      passed = comparison.meanAbsoluteChannelDifference <= tolerance.maximumMeanDifference &&
        comparison.changedPixelFractionAboveThreshold <= tolerance.maximumChangedPixelFraction;
    }
    check(`${comparison.name}: model-region pixel comparison`, passed, comparison);
  }
  check('No browser or HTTP errors', report.errors.length === 0, report.errors);
  report.status = 'pass';
  report.limitations = 'Headless Chrome at the stated viewport. Round trips allow small floating-point/antialiasing differences; exactlyEqual reports actual pixel identity. Real-device FPS, model aesthetics and other controls are outside this test.';
})().catch(error => {
  report.status = 'fail';
  report.failure = error.stack || String(error);
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(report, null, 2) + '\n');
  await browser?.close();
  console.log(`Rotation evidence: ${output}`);
});
