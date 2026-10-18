const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { validateSettings } = require('./settings');
const check = process.argv.includes('--check');
const root = path.resolve(__dirname, '..');
const catalogue = JSON.parse(fs.readFileSync(path.join(root, 'data/quotes.json'), 'utf8'));
assert(Array.isArray(catalogue.entries) && catalogue.entries.length > 0, 'The catalogue must contain bilingual entries.');
const count = catalogue.entries.length;
const ids = new Set();
const texts = {en: new Set(), de: new Set()};
for (const entry of catalogue.entries) {
  assert.match(entry.id, /^le-\d{3}$/);
  assert(!ids.has(entry.id), 'Duplicate entry id: ' + entry.id);
  ids.add(entry.id);
  for (const lang of ['en', 'de']) {
    assert.equal(typeof entry[lang], 'string');
    assert(entry[lang].trim().length > 12);
    assert(entry[lang].length <= 110, 'Entry too long: ' + entry.id + ' ' + lang);
    const normalized = entry[lang].toLocaleLowerCase(lang).replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    assert(!texts[lang].has(normalized), 'Duplicate text: ' + entry.id + ' ' + lang);
    texts[lang].add(normalized);
  }
}
const data = {
  catalogue_version: catalogue.catalogue_version,
  epoch_local_day: Math.floor(Date.parse(catalogue.epoch + 'T00:00:00Z') / 86400000),
  entries: catalogue.entries.map(({id, en, de}) => ({id, en, de}))
};
const settingsTemplate = fs.readFileSync(path.join(root, 'src/settings.template.yml'), 'utf8').replaceAll('__ENTRY_COUNT__', count);
const escapeCell = s => s.replace(/\n/g, ' / ').replace(/\|/g, '\\|');
const rows = catalogue.entries.map(q => '| ' + q.id + ' | ' + escapeCell(q.en) + ' | ' + escapeCell(q.de) + ' |');
const outputs = {
  'docs/custom-fields.yml': settingsTemplate.split('custom_fields:\n')[1].replace(/^  /gm, ''),
  'src/settings.yml': settingsTemplate.replace('__CATALOGUE__', JSON.stringify(JSON.stringify(data))),
  'data/static_data.json': JSON.stringify(data, null, 2) + '\n',
  'docs/quotes.md': '# LOW EXPECTATIONS: the first ' + count + ' days\n\nThese lines were written for this prototype. They have no invented author attribution.\nGerman uses Swiss spelling. The two languages share an entry ID and daily position.\n\n| ID | English | Deutsch |\n| --- | --- | --- |\n' + rows.join('\n') + '\n'
};
for (const [filename, expected] of Object.entries(outputs)) {
  const destination = path.join(root, filename);
  if (check) {
    const actual = fs.readFileSync(destination, 'utf8');
    if (filename === 'src/settings.yml') validateSettings(actual, expected);
    else assert.equal(actual, expected, 'Generated file is stale; run npm run build: ' + filename);
  } else {
    fs.writeFileSync(destination, expected);
  }
}
console.log((check ? 'Checked ' : 'Built ') + count + ' bilingual entries; static data ' + Buffer.byteLength(JSON.stringify(data)) + ' bytes; epoch local day ' + data.epoch_local_day + '.');
