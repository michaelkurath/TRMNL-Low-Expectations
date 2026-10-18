const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const { parse } = require('yaml');
const root = path.resolve(__dirname, '..');

const shots = [
  ['og-full-en', 'OG · Full · English'],
  ['og-full-de', 'OG · Full · Deutsch'],
  ['og-half_horizontal-de', 'OG · Half Horizontal · Deutsch'],
  ['og-half_vertical-en', 'OG · Half Vertical · English'],
  ['og-quadrant-de', 'OG · Quadrant · Deutsch'],
  ['x-full-en', 'X · Full · English'],
  ['x-portrait-full-de', 'X portrait · Full · Deutsch']
];

async function main() {
  // Always make fresh native-framework previews before copying the artwork.
  // This preserves the full-catalogue validation report from npm run render.
  execFileSync(process.execPath, [path.join(__dirname, 'render.js'), '--preview'], {
    cwd: root, env: process.env, stdio: 'inherit'
  });
  const assetDir = path.join(root, 'assets');
  const screenDir = path.join(assetDir, 'screenshots');
  fs.mkdirSync(screenDir, { recursive: true });
  for (const [name] of shots) {
    fs.copyFileSync(path.join(root, 'previews', name + '.png'), path.join(screenDir, name + '.png'));
  }

  const args = ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'];
  if (process.env.LE_BROWSER_PATH) args.push('--no-zygote', '--disable-software-rasterizer');
  const browser = await chromium.launch({
    executablePath: process.env.LE_BROWSER_PATH || undefined, headless: true, args
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 840 }, deviceScaleFactor: 1 });
    // No asset in this package needs a network request.
    await page.route('**/*', route => route.abort());
    const svg = fs.readFileSync(path.join(assetDir, 'icon.svg'), 'utf8');
    await page.setContent('<!doctype html><html><head><style>html,body{margin:0;background:transparent}svg{display:block}</style></head><body>' + svg + '</body></html>');
    await page.locator('svg').screenshot({ path: path.join(assetDir, 'icon-512.png'), omitBackground: true });

    const image = filename => 'data:image/png;base64,' + fs.readFileSync(path.join(assetDir, filename)).toString('base64');
    const font = fs.readFileSync(path.join(process.env.LE_FONTS_DIR, 'Inter.ttf')).toString('base64');
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
      @font-face{font-family:Inter;src:url(data:font/ttf;base64,${font});font-weight:100 900}
      *{box-sizing:border-box}html,body{margin:0;width:1280px;height:840px;background:#eeefeb;color:#101110;font-family:Inter,Arial,sans-serif}
      main{padding:36px 32px}header{display:flex;align-items:center;gap:24px;height:112px}
      .icon{width:112px;height:112px}h1{font-size:48px;line-height:1.05;letter-spacing:-2px;margin:0 0 10px;font-weight:650}
      .tagline{font-size:23px;margin:0;letter-spacing:-.5px}.features{font-size:17px;margin:22px 0 30px;letter-spacing:.2px}
      .screens{display:grid;grid-template-columns:780px 375px;gap:30px}.label{font-size:13px;margin:0 0 12px;color:#414540}
      .shot{display:block;background:white}.full{width:780px;height:460px}.small{width:375px;height:225px}
      .horizontal{width:375px;height:auto}.second{margin-top:27px}.note{font-size:12px;color:#575c55;margin:26px 0 0}
    </style></head><body><main>
      <header><img class="icon" src="${image('icon-512.png')}" alt="Calendar with minus sign"><div><h1>Low Expectations</h1><p class="tagline">A fresh disappointment. Every day.</p></div></header>
      <p class="features">365 daily entries · English / Deutsch · Four layouts</p>
      <div class="screens"><section><p class="label">OG · Full · English</p><img class="shot full" src="${image('screenshots/og-full-en.png')}" alt="Full calendar in English"></section>
      <section><p class="label">OG · Quadrant · Deutsch</p><img class="shot small" src="${image('screenshots/og-quadrant-de.png')}" alt="Quarter calendar in German">
      <p class="label second">OG · Half Horizontal · Deutsch</p><img class="shot horizontal" src="${image('screenshots/og-half_horizontal-de.png')}" alt="Half horizontal calendar in German"></section></div>
      <p class="note">Preview date: 17 October 2026 · The installed calendar follows your local date.</p>
    </main></body></html>`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(assetDir, 'recipe-preview.png') });
  } finally {
    await browser.close();
  }

  const settings = parse(fs.readFileSync(path.join(root, 'src/settings.yml'), 'utf8'));
  const about = settings.custom_fields.find(field => field.keyname === 'author_bio').description;
  const words = about.trim().split(/\s+/).length;
  if (words < 100) throw new Error('The recipe About text should contain at least 100 words for search-engine eligibility.');
  const manifest = {
    version: JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version,
    reference_date: '2026-10-17',
    source: 'LiquidJS + local TRMNL Framework 3.4.3 browser renders',
    icon: { svg: 'assets/icon.svg', png: 'assets/icon-512.png', width: 512, height: 512 },
    overview: { file: 'assets/recipe-preview.png', width: 1280, height: 840 },
    screenshots: shots.map(([name, label]) => {
      const file = 'assets/screenshots/' + name + '.png';
      const bytes = fs.readFileSync(path.join(root, file));
      return { file, label, width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
    }),
    about_word_count: words,
    hosted_render_review: 'pending',
    physical_device_review: 'pending',
    publication: 'not submitted'
  };
  fs.writeFileSync(path.join(root, 'docs/recipe-assets.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify({ screenshots: shots.length, aboutWords: words, icon: '512×512 PNG + SVG', publication: manifest.publication }));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
