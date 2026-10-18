const assert = require('node:assert/strict');
const { parse } = require('yaml');

function validateSettings(actualYaml, expectedYaml) {
  const actual = parse(actualYaml);
  const expected = parse(expectedYaml);
  // TRMNL reorders YAML and adds defaults for inactive strategies when exporting.
  for (const [key, value] of Object.entries(expected)) {
    if (key === 'static_data') {
      assert.deepEqual(JSON.parse(actual[key]), JSON.parse(value), 'Static catalogue differs from the source.');
    } else {
      assert.deepEqual(actual[key], value, 'Setting differs from the source: ' + key);
    }
  }
}

module.exports = { validateSettings };
