const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { context, render, root } = require('./template');

const frameworkDir = process.env.LE_FRAMEWORK_DIR;
const fontsDir = process.env.LE_FONTS_DIR;
if (!frameworkDir || !fontsDir) {
  throw new Error('Set LE_FRAMEWORK_DIR to the extracted Framework 3.4.3 bundle and LE_FONTS_DIR to its TRMNL font bundle. See docs/validation.md.');
}
const catalogue = JSON.parse(fs.readFileSync(path.join(root, 'data/static_data.json'), 'utf8'));
const layouts = ['full', 'half_horizontal', 'half_vertical', 'quadrant'];
const devices = [
  {key:'og', width:800, height:480, classes:'screen--og screen--md screen--1bit'},
  {key:'x', width:1040, height:780, classes:'screen--v2 screen--lg screen--density-2x screen--4bit'},
  {key:'x-portrait', width:780, height:1040, classes:'screen--v2 screen--lg screen--density-2x screen--4bit screen--portrait'},
  {key:'x-legacy', width:1024, height:768, classes:'screen--v2 screen--lg screen--density-2x screen--4bit'}
];
function screenHtml(markup, device, layout, cssHref) {
  let content = markup;
  if (layout !== 'full') {
    const names = {half_horizontal:'1Tx1B', half_vertical:'1Lx1R', quadrant:'2x2'};
    const blanks = layout === 'quadrant' ? 3 : 1;
    content = '<div class="mashup mashup--' + names[layout] + '">' + markup +
      '<div class="view view--' + layout + '"></div>'.repeat(blanks) + '</div>';
  }
  return '<!doctype html><html><head><meta charset="utf-8"><title>LOW EXPECTATIONS — ' + device.key + ' ' + layout + '</title>' +
    '<link rel="stylesheet" href="' + cssHref + '">' +
    '<style>html,body{margin:0;padding:0;background:white;} .screen{--screen-w:' + device.width + 'px;--screen-h:' + device.height +
    'px;width:' + device.width + 'px;height:' + device.height + 'px;}</style></head>' +
    '<body class="trmnl"><div class="screen ' + device.classes + '" style="--screen-w:' + device.width + 'px;--screen-h:' + device.height + 'px;">' + content + '</div></body></html>';
}
async function main() {
  const args = ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'];
  if (process.env.LE_BROWSER_PATH) args.push('--no-zygote', '--disable-software-rasterizer');
  const browser = await chromium.launch({
    executablePath: process.env.LE_BROWSER_PATH || undefined,
    headless: true, args
  });
  const page = await browser.newPage();
  const errors = [];
  const findings = [];
  const renderedSizes = [];
  let checks = 0;
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/plugins.css') {
      return route.fulfill({path: path.join(frameworkDir,'css/plugins.min.css'), contentType:'text/css'});
    }
    if (url.pathname.startsWith('/fonts/')) {
      const filename = path.basename(url.pathname);
      const candidate = path.join(fontsDir, filename);
      if (fs.existsSync(candidate)) {
        return route.fulfill({path:candidate, contentType: filename.endsWith('woff2') ? 'font/woff2' : 'font/ttf'});
      }
    }
    return route.abort();
  });
  try {
    for (const device of devices) {
      await page.setViewportSize({width:device.width,height:device.height});
      for (const layout of layouts) {
        for (const language of ['en','de']) {
          const markup = await render(layout, context(undefined, undefined, language));
          let html = screenHtml(markup,device,layout,'https://low-expectations.test/plugins.css');
          await page.setContent(html, {waitUntil:'load'});
          await page.evaluate(() => document.fonts.ready);
          const view = page.locator('.le-view');
          const box = await view.boundingBox();
          const frame = await page.evaluate(() => {
            const screen = document.querySelector('.screen');
            const style = getComputedStyle(screen);
            const mashup = document.querySelector('.mashup');
            return {
              width: screen.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
              height: screen.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom),
              gap: mashup ? parseFloat(getComputedStyle(mashup).gap) : 0,
              scale: screen.getBoundingClientRect().width / screen.offsetWidth
            };
          });
          const expectedWidth = layout === 'half_vertical' || layout === 'quadrant' ? (frame.width - frame.gap)/2 : frame.width;
          const expectedHeight = layout === 'half_horizontal' || layout === 'quadrant' ? (frame.height - frame.gap)/2 : frame.height;
          if (Math.abs(box.width/frame.scale - expectedWidth) > 16 || Math.abs(box.height/frame.scale - expectedHeight) > 4) {
            findings.push({device:device.key,layout,language,issue:'Unexpected native view dimensions',box,expectedWidth,expectedHeight});
          }
          renderedSizes.push({device:device.key,layout,language,width:box.width/frame.scale,height:box.height/frame.scale,pixelRatio:frame.scale});
          const basename = device.key + '-' + layout + '-' + language;
          await view.screenshot({path:path.join(root,'previews',basename+'.png')});
          if (device.key === 'og' || device.key === 'x') {
            const publicHtml = screenHtml(markup,device,layout,'https://trmnl.com/css/3.4.3/plugins.css');
            fs.writeFileSync(path.join(root,'previews',basename+'.html'),publicHtml);
          }
          for (let i = 0; i < catalogue.entries.length; i++) {
            const iso = new Date(Date.parse('2026-10-17T12:00:00Z') + i * 86400000).toISOString();
            const nextMarkup = await render(layout, context(iso, 0, language));
            await page.evaluate(next => {
              const parsed = new DOMParser().parseFromString(next,'text/html');
              document.querySelector('.le-paper').replaceWith(parsed.querySelector('.le-paper'));
            }, nextMarkup);
            const overflow = await page.evaluate(() => {
              const result = [];
              const paper = document.querySelector('.le-paper');
              const body = paper.querySelector('.le-body').getBoundingClientRect();
              const paperBox = paper.getBoundingClientRect();
              const view = document.querySelector('.le-view').getBoundingClientRect();
              for (const selector of ['.le-date','.le-quote','.le-masthead']) {
                const node = paper.querySelector(selector);
                const box = node.getBoundingClientRect();
                if (box.left < paperBox.left - 1 || box.right > paperBox.right + 1 ||
                    box.top < paperBox.top - 1 || box.bottom > paperBox.bottom + 1 ||
                    node.scrollWidth > node.clientWidth + 2 || node.scrollHeight > node.clientHeight + 2) {
                  result.push(selector + ' overflows paper');
                }
                if ((selector === '.le-date' || selector === '.le-quote') &&
                    (box.top < body.top - 1 || box.bottom > body.bottom + 1)) {
                  result.push(selector + ' overflows calendar body');
                }
              }
              if (paperBox.bottom > view.bottom + 1 || paperBox.right > view.right + 1) result.push('Paper overflows view');
              return result;
            });
            if (overflow.length) findings.push({device:device.key,layout,language,id:catalogue.entries[i].id,issues:overflow});
            checks++;
          }
        }
      }
    }
    const summary = {
      generated_at: new Date().toISOString(),
      framework:'3.4.3',
      engine:'LiquidJS 10.21.1 + Chromium',
      browser:await browser.version(),
      checks,
      devices:devices.map(d=>({name:d.key,width:d.width,height:d.height})),
      language_count:2, catalogue_entries:30, renderedSizes, findings, runtime_errors:errors,
      limitation:'Local native-framework previews; hosted TRMNL rendering and physical device verification still pending. The display changes on its next scheduled refresh.'
    };
    fs.writeFileSync(path.join(root,'docs/render-results.json'),JSON.stringify(summary,null,2)+'\n');
    console.log(JSON.stringify({checks,findings:findings.slice(0,20),totalFindings:findings.length,runtimeErrors:errors}));
    if (findings.length || errors.length) process.exitCode=1;
  } finally {
    await browser.close();
  }
}
main().catch(error => {console.error(error); process.exitCode=1;});
