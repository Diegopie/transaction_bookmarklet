/**
 * @file providers/index.js
 * @description Registry of supported bank/card accounts.
 *
 * To add one: create ./<key>.js exporting the same shape as sofi-checking.js,
 * then add it to the list below. No other file needs to change.
 *
 * A provider's `key` is the folder name under data/ and the --provider value.
 * Optional `aliases` let extra folder names resolve to the same adapter.
 */

const adapters = [
  require('./sofi-checking'),
  require('./sofi-savings'),
];

const registry = {};
for (const adapter of adapters) {
  registry[adapter.key] = adapter;
}

/** Alias -> canonical key (e.g. "sofi" -> "sofi-checking"). */
const aliasMap = {};
for (const adapter of adapters) {
  for (const alias of adapter.aliases || []) {
    aliasMap[alias.toLowerCase()] = adapter.key;
  }
}

/** All registered adapters. */
function list() {
  return adapters.slice();
}

/** All canonical provider keys. */
function keys() {
  return adapters.map(a => a.key);
}

/** Every accepted folder name, canonical keys plus aliases. */
function folderNames() {
  return keys().concat(Object.keys(aliasMap));
}

/** Looks up an adapter by key or alias; undefined if unknown. */
function get(key) {
  const k = String(key || '').toLowerCase();
  return registry[k] || registry[aliasMap[k]];
}

module.exports = { registry, list, keys, folderNames, get };
