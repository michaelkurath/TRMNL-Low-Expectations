const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { context, render, value, entryId, localDate, root } = require('../scripts/template');
const { validateSettings } = require('../scripts/settings');
const { parse, stringify } = require('yaml');
const catalogue = JSON.parse(fs.readFileSync(path.join(root, 'data/static_data.json'), 'utf8'));

test('a full-year catalogue of 365 bilingual entries with distinct IDs and text', () => {
  assert.equal(catalogue.entries.length, 365);
  for (const entry of catalogue.entries) {
    assert.match(entry.id, /^le-\d{3}$/);
    for (const lang of ['en', 'de']) assert.equal(typeof entry[lang], 'string');
  }
  for (const key of ['id', 'en', 'de']) {
    assert.equal(new Set(catalogue.entries.map(q => q[key])).size, catalogue.entries.length);
  }
});
test('each entry appears in order once during a complete cycle, then the cycle repeats', async () => {
  const count = catalogue.entries.length;
  const ids = [];
  for (let day = 0; day <= count; day++) {
    const iso = new Date((catalogue.epoch_local_day + day) * 86400000 + 12 * 3600000).toISOString();
    const html = await render('full', context(iso, 0));
    assert.equal(localDate(html), iso.slice(0, 10));
    ids.push(entryId(html));
  }
  assert.deepEqual(ids.slice(0, count), catalogue.entries.map(q => q.id));
  assert.equal(ids[count], ids[0]);
});
test('refreshes within a local day do not change the selected line', async () => {
  const ids = [];
  for (const iso of ['2026-10-16T22:00:00Z', '2026-10-17T08:00:00Z', '2026-10-17T21:59:59Z']) {
    const html = await render('full', context(iso));
    assert.equal(localDate(html), '2026-10-17');
    ids.push(entryId(html));
  }
  assert.equal(new Set(ids).size, 1);
});
test('the page changes at local midnight in Zurich, New York and Nepal', async () => {
  for (const [offset, before, after] of [
    [7200, '2026-10-16T21:59:59Z', '2026-10-16T22:00:00Z'],
    [-14400, '2026-10-17T03:59:59Z', '2026-10-17T04:00:00Z'],
    [20700, '2026-10-16T18:14:59Z', '2026-10-16T18:15:00Z']
  ]) {
    const a = await render('full', context(before, offset));
    const b = await render('full', context(after, offset));
    assert.equal(localDate(a), '2026-10-16');
    assert.equal(localDate(b), '2026-10-17');
    assert.notEqual(entryId(a), entryId(b));
  }
});
test('clock changes do not skip or repeat a date within the same DST transition day', async () => {
  for (const [a, aOffset, b, bOffset] of [
    ['2026-03-29T00:59:59Z', 3600, '2026-03-29T01:00:00Z', 7200],
    ['2026-10-25T00:59:59Z', 7200, '2026-10-25T01:00:00Z', 3600]
  ]) {
    const first = await render('full', context(a, aOffset));
    const second = await render('full', context(b, bOffset));
    assert.equal(localDate(first), localDate(second));
    assert.equal(entryId(first), entryId(second));
  }
});
test('year boundaries continue the rotation and leap-year totals are correct', async () => {
  for (const [iso, total, day] of [
    ['2028-02-29T12:00:00Z', 366, 60],
    ['2100-12-31T12:00:00Z', 365, 365],
    ['2000-12-31T12:00:00Z', 366, 366]
  ]) {
    const html = await render('full', context(iso, 0));
    assert(html.includes('DAY ' + day + ' OF ' + total));
    assert.notEqual(entryId(html), 'fallback');
  }
  const a = await render('full', context('2026-12-31T12:00:00Z', 0));
  const b = await render('full', context('2027-01-01T12:00:00Z', 0));
  assert.notEqual(entryId(a), entryId(b));
});
test('German translates the calendar and preserves the entry chosen in English', async () => {
  const en = await render('full', context('2026-03-19T12:00:00Z', 0, 'en'));
  const de = await render('full', context('2026-03-19T12:00:00Z', 0, 'de'));
  assert.equal(entryId(en), entryId(de));
  assert.equal(value(de, 'le-weekday'), 'DONNERSTAG');
  assert.equal(value(de, 'le-month'), 'MÄRZ');
  assert(de.includes('TÄGLICHE DEMOTIVATION'));
});
test('missing and unknown language settings fall back to English', async () => {
  for (const lang of [undefined, '', 'unknown', 'fr']) {
    const html = await render('full', context(undefined, undefined, lang));
    assert.equal(value(html, 'le-weekday'), 'SATURDAY');
    assert(html.includes('Tomorrow is a fresh start.'));
  }
});
test('missing data produces a readable localized fallback', async () => {
  for (const lang of ['en', 'de']) {
    const html = await render('full', context(undefined, undefined, lang, {entries: []}));
    assert.equal(entryId(html), 'fallback');
    assert(html.includes(lang === 'de' ? 'Deine Pläne werden noch geladen.' : 'Your plans are still loading.'));
  }
});
test('text is escaped before display', async () => {
  const html = await render('full', context(undefined, undefined, 'en', {
    epoch_local_day: 20743,
    entries: [{id: 'escape-test', en: '<b>Less & less</b>', de: 'Weniger'}]
  }));
  assert(html.includes('&lt;b&gt;Less &amp; less&lt;/b&gt;'));
  assert(!html.includes('<b>Less & less</b>'));
});
test('all four layouts show the same date and quote', async () => {
  const rendered = await Promise.all(['full', 'half_horizontal', 'half_vertical', 'quadrant'].map(l => render(l)));
  assert.equal(new Set(rendered.map(entryId)).size, 1);
  assert.equal(new Set(rendered.map(localDate)).size, 1);
  assert.equal(new Set(rendered.map(h => value(h, 'le-quote'))).size, 1);
});
test('generated settings contain the current catalogue and a short description', () => {
  const settings = fs.readFileSync(path.join(root, 'src/settings.yml'), 'utf8');
  const values = parse(settings);
  assert.deepEqual(JSON.parse(values.static_data), catalogue);
  assert(values.description.length <= 35);
  assert.equal(values.strategy, 'static');
});
test('settings validation accepts TRMNL formatting and rejects changed content or language fields', () => {
  const expected = fs.readFileSync(path.join(root, 'src/settings.yml'), 'utf8');
  const values = Object.fromEntries(Object.entries(parse(expected)).reverse());
  values.polling_verb = 'get';
  values.polling_url = '';
  values.oauth_enabled = 'false';
  values.static_data = JSON.stringify(JSON.parse(values.static_data), null, 2);
  assert.doesNotThrow(() => validateSettings(stringify(values), expected));
  const stale = {...values, static_data: JSON.stringify({...catalogue, entries: catalogue.entries.slice(0, -1)})};
  assert.throws(() => validateSettings(stringify(stale), expected), /Static catalogue differs/);
  assert.throws(() => validateSettings(stringify({...values, custom_fields: []}), expected), /custom_fields/);
});
