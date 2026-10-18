const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { context, render, value, entryId, localDate, root } = require('../scripts/template');
const catalogue = JSON.parse(fs.readFileSync(path.join(root, 'data/static_data.json'), 'utf8'));

test('30 complete bilingual entries, distinct IDs and distinct text', () => {
  assert.equal(catalogue.entries.length, 30);
  for (const key of ['id', 'en', 'de']) {
    assert.equal(new Set(catalogue.entries.map(q => q[key])).size, 30);
  }
});
test('each entry appears once during the first 30 local days, then the cycle repeats', async () => {
  const ids = [];
  for (let day = 0; day <= 30; day++) {
    const iso = new Date(Date.parse('2026-10-17T12:00:00Z') + day * 86400000).toISOString();
    ids.push(entryId(await render('full', context(iso, 0))));
  }
  assert.equal(new Set(ids.slice(0, 30)).size, 30);
  assert.equal(ids[0], 'le-001');
  assert.equal(ids[29], 'le-030');
  assert.equal(ids[30], ids[0]);
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
  const scalar = settings.match(/^static_data: (.+)$/m)[1];
  assert.deepEqual(JSON.parse(JSON.parse(scalar)), catalogue);
  assert(settings.match(/^description: (.+)$/m)[1].length <= 35);
  assert.equal(settings.match(/^strategy: (.+)$/m)[1], 'static');
});
