// Match the UTC host used for native Liquid rendering.
process.env.TZ = "UTC";
const fs = require('node:fs');
const path = require('node:path');
const { Liquid } = require(process.env.LE_LIQUIDJS_PATH || 'liquidjs');
const root = path.resolve(__dirname, '..');
const engine = new Liquid({ timezoneOffset: 0 });
const compiled = new Map();
function context(iso = '2026-10-17T10:00:00Z', offset = 7200, language = 'en', data) {
  const catalogue = data || JSON.parse(fs.readFileSync(path.join(root, 'data/static_data.json'), 'utf8'));
  return {
    ...catalogue,
    trmnl: {
      system: { timestamp_utc: Math.floor(Date.parse(iso) / 1000) },
      user: { utc_offset: offset },
      plugin_settings: { custom_fields_values: { language } }
    }
  };
}
async function render(layout = 'full', input = context()) {
  if (!compiled.has(layout)) {
    const source = fs.readFileSync(path.join(root, 'src/shared.liquid'), 'utf8') + '\n' +
      fs.readFileSync(path.join(root, 'src/' + layout + '.liquid'), 'utf8');
    compiled.set(layout, engine.parse(source));
  }
  return engine.render(compiled.get(layout), input);
}
function value(html, className) {
  const match = html.match(new RegExp('<[^>]+class="' + className + '"[^>]*>([^<]*)<'));
  return match ? match[1] : null;
}
function entryId(html) {
  return html.match(/data-entry-id="([^"]+)"/)[1];
}
function localDate(html) {
  return html.match(/data-local-date="([^"]+)"/)[1];
}
module.exports = { context, render, value, entryId, localDate, root };
