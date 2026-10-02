/**
 * @file pipeline.js
 * @description Provider-agnostic pipeline: discover data files, route each to the
 * right account adapter, read and validate, de-duplicate, transform, and sort.
 */

const fs = require('fs');
const path = require('path');
const { parseCSV } = require('./csv');
const { transformRecord } = require('./transform');
const providers = require('./providers');

/** Finds a column index by header name (case-insensitive); -1 if absent. */
function colIndex(header, name) {
  if (!name) return -1;
  return header.findIndex(h => h.trim().toLowerCase() === String(name).toLowerCase());
}

/**
 * Matches a filename against adapters' filePatterns.
 * Banks name exports after the account, which is more reliable than the folder.
 */
function matchByFilename(fileName) {
  const name = String(fileName).toLowerCase();
  for (const adapter of providers.list()) {
    for (const pattern of adapter.filePatterns || []) {
      if (name.includes(String(pattern).toLowerCase())) return adapter;
    }
  }
  return undefined;
}

/**
 * Scans data/ and assigns every CSV to an account adapter.
 *
 * A file's adapter comes from its filename when a pattern matches, otherwise from
 * its folder. Multiple folders mapping to one adapter are merged into a single
 * entry so they cannot overwrite each other's output.
 *
 * @returns {{found:Array, unknown:string[], looseFiles:string[], rerouted:Array}}
 */
function discover(dataDir) {
  const byKey = new Map();
  const unknown = [];
  const looseFiles = [];
  const rerouted = [];

  if (!fs.existsSync(dataDir)) {
    return { found: [], unknown, looseFiles, rerouted };
  }

  const add = (adapter, dir, file) => {
    if (!byKey.has(adapter.key)) {
      byKey.set(adapter.key, { provider: adapter, sources: [] });
    }
    byKey.get(adapter.key).sources.push({ dir, file, fullPath: path.join(dir, file) });
  };

  for (const entry of fs.readdirSync(dataDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const folderAdapter = providers.get(entry.name);
      if (!folderAdapter) { unknown.push(entry.name); continue; }

      const dir = path.join(dataDir, entry.name);
      const files = fs.readdirSync(dir)
        .filter(f => f.toLowerCase().endsWith('.csv'))
        .sort();

      for (const file of files) {
        const byName = matchByFilename(file);
        const adapter = byName || folderAdapter;
        if (byName && byName.key !== folderAdapter.key) {
          rerouted.push({ file, folder: entry.name, to: byName.key });
        }
        add(adapter, dir, file);
      }
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.csv')) {
      looseFiles.push(entry.name);
    }
  }

  // Keep registry order so output is stable run to run.
  const found = providers.keys()
    .filter(k => byKey.has(k))
    .map(k => byKey.get(k));

  return { found, unknown, looseFiles, rerouted };
}

/** Reads one CSV into raw records shaped by the adapter's column map. */
function readFile(filePath, provider) {
  const rows = parseCSV(fs.readFileSync(filePath, 'utf8'));
  if (rows.length < 2) return [];

  const header = rows[0];
  for (const required of provider.requiredHeaders || []) {
    if (colIndex(header, required) === -1) {
      throw new Error(
        `${path.basename(filePath)}: not a ${provider.displayName} export ` +
        `(missing "${required}" column). Found: ${header.join(', ')}`
      );
    }
  }

  const cols = provider.columns;
  const idx = {
    date: colIndex(header, cols.date),
    description: colIndex(header, cols.description),
    amount: colIndex(header, cols.amount),
    balance: colIndex(header, cols.balance),
    status: colIndex(header, cols.status),
  };

  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length === 1 && r[0].trim() === '') continue;
    const pick = j => (j === -1 ? '' : (r[j] || '').trim());
    out.push({
      date: pick(idx.date),
      description: pick(idx.description),
      amount: pick(idx.amount),
      balance: pick(idx.balance),
      status: pick(idx.status),
    });
  }
  return out;
}

/**
 * True when a record passes the adapter's includeOnlyDescriptions filter.
 * Adapters without that setting keep every row.
 */
function passesFilter(rec, provider) {
  const only = provider.includeOnlyDescriptions;
  if (!only || !only.length) return true;
  const haystack = String(rec.description || '').toLowerCase();
  return only.some(needle => haystack.includes(String(needle).toLowerCase()));
}

/**
 * Runs one account end to end across all of its source files.
 * @returns {{provider:Object, records:Array, stats:Object}}
 */
function runProvider(entry) {
  const { provider, sources } = entry;
  const seen = new Set();
  const raw = [];
  const perFile = [];
  let duplicates = 0;
  let filtered = 0;

  for (const src of sources) {
    const records = readFile(src.fullPath, provider);
    let kept = 0;
    for (const rec of records) {
      if (!passesFilter(rec, provider)) { filtered++; continue; }
      const key = `${rec.date}|${rec.description}|${rec.amount}|${rec.balance}`;
      if (seen.has(key)) { duplicates++; continue; }
      seen.add(key);
      raw.push(rec);
      kept++;
    }
    perFile.push({ file: src.file, rows: records.length, kept });
  }

  // Exports are newest-first; reverse then stable-sort ascending so merged
  // files end up oldest-first overall.
  if (provider.newestFirst !== false) raw.reverse();

  const records = raw.map(r => transformRecord(r, provider));
  records.sort((a, b) => (a._iso || '').localeCompare(b._iso || ''));

  return {
    provider,
    records,
    stats: { files: perFile, total: records.length, duplicates, filtered },
  };
}

/** Builds a category-distribution + uncategorized summary for a record set. */
function summarize(records) {
  const byCategory = {};
  const uncategorized = {};
  for (const r of records) {
    const cat = r.category || '(blank)';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
    if (!r.category) {
      uncategorized[r.description] = (uncategorized[r.description] || 0) + 1;
    }
  }
  const sortDesc = obj => Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  return {
    total: records.length,
    categorized: records.filter(r => r.category).length,
    byCategory: sortDesc(byCategory),
    uncategorized: sortDesc(uncategorized),
  };
}

/**
 * Groups records into calendar months by their ISO date.
 * @returns {Array<{month:string, records:Array}>} oldest month first; undated
 *          rows land in a trailing "unknown" group.
 */
function groupByMonth(records) {
  const groups = new Map();
  for (const r of records) {
    const month = (r._iso || '').slice(0, 7) || 'unknown';
    if (!groups.has(month)) groups.set(month, []);
    groups.get(month).push(r);
  }
  return [...groups.entries()]
    .sort((a, b) => {
      if (a[0] === 'unknown') return 1;
      if (b[0] === 'unknown') return -1;
      return a[0].localeCompare(b[0]);
    })
    .map(([month, recs]) => ({ month, records: recs }));
}

module.exports = {
  discover, readFile, runProvider, summarize, groupByMonth,
  colIndex, matchByFilename,
};
