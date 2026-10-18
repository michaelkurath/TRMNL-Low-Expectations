const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const catalogue = JSON.parse(fs.readFileSync(path.join(root, 'data/quotes.json'), 'utf8'));
assert.equal(catalogue.entries.length, 30, 'The prototype must contain 30 complete bilingual entries.');
const ids = new Set();
for (const entry of catalogue.entries) {
  assert.match(entry.id, /^le-\d{3}$/);
  assert(!ids.has(entry.id), 'Duplicate entry id: ' + entry.id);
  ids.add(entry.id);
  for (const lang of ['en', 'de']) {
    assert.equal(typeof entry[lang], 'string');
    assert(entry[lang].trim().length > 12);
    assert(entry[lang].length <= 110, 'Entry too long: ' + entry.id + ' ' + lang);
  }
}
const data = {
  catalogue_version: catalogue.catalogue_version,
  epoch_local_day: Math.floor(Date.parse(catalogue.epoch + 'T00:00:00Z') / 86400000),
  entries: catalogue.entries.map(({id, en, de}) => ({id, en, de}))
};
const settingsTemplate = fs.readFileSync(path.join(root, 'src/settings.template.yml'), 'utf8');
fs.writeFileSync(path.join(root, 'docs/custom-fields.yml'), settingsTemplate.split('custom_fields:\n')[1].replace(/^  /gm, ''));
fs.writeFileSync(path.join(root, 'src/settings.yml'), settingsTemplate.replace('__CATALOGUE__', JSON.stringify(JSON.stringify(data))));
fs.writeFileSync(path.join(root, 'data/static_data.json'), JSON.stringify(data, null, 2) + '\n');
const escapeCell = s => s.replace(/\n/g, ' / ').replace(/\|/g, '\\|');
const rows = catalogue.entries.map(q => '| ' + q.id + ' | ' + escapeCell(q.en) + ' | ' + escapeCell(q.de) + ' |');
fs.writeFileSync(path.join(root, 'docs/quotes.md'), '# LOW EXPECTATIONS: the first 30 days\n\nThese lines were written for this prototype. They have no invented author attribution.\nGerman uses Swiss spelling. The two languages share an entry ID and daily position.\n\n| ID | English | Deutsch |\n| --- | --- | --- |\n' + rows.join('\n') + '\n');
console.log('Built 30 bilingual entries; static data ' + Buffer.byteLength(JSON.stringify(data)) + ' bytes; epoch local day ' + data.epoch_local_day + '.');
