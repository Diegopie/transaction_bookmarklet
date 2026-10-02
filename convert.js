#!/usr/bin/env node
/**
 * @file convert.js
 * @description Normalizes bank/card CSV exports in data/<account>/ into the
 * budget-spreadsheet format: Description, Account, Date (M/D/YYYY), Category,
 * Amount (expenses positive, deposits negative).
 *
 * Output is always split into one CSV per calendar month. By default each
 * platform gets its own set of files (sofi-2026-07.csv, amex-2026-07.csv);
 * --single merges every platform into one sheet per month.
 *
 * Interactive:  node convert.js
 * Scripted:     node convert.js --all
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { toCSV } = require('./lib/csv');
const { discover, runProvider, summarize, groupByMonth } = require('./lib/pipeline');
const providers = require('./lib/providers');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const OUTPUT_DIR = path.join(ROOT, 'output');

const OUTPUT_HEADERS = ['Description', 'Account', 'Date', 'Category', 'Amount'];
const OUTPUT_KEYS = ['description', 'account', 'date', 'category', 'amount'];

const HELP = [
  'Normalize bank CSV exports into the budget spreadsheet format.',
  '',
  'Usage:',
  '  node convert.js                     Interactive menu',
  '  node convert.js --all               Every platform, its own CSV per month',
  '  node convert.js --all --single      All platforms merged, one CSV per month',
  '  node convert.js --provider sofi     Just one account',
  '  node convert.js --list              Show detected accounts and exit',
  '',
  'Options:',
  '  --provider <key>   Account to run (repeatable). Folder name under data/.',
  '  --all              Run every detected account.',
  '  --single           Merge every platform into one sheet per month.',
  '  --by-account       Separate file per account instead of per platform.',
  '  --no-split         One file covering the whole range (no monthly split).',
  '  --report json      Also write output/report.json (machine-readable summary).',
  '  --list             List detected accounts, then exit.',
  '  -h, --help         Show this help.',
  '',
  'Default output is one CSV per platform per month, e.g. sofi-2026-07.csv.',
  'SoFi checking and savings land in the same file, told apart by the Account',
  'column. With --single everything merges into combined-2026-07.csv, etc.',
].join('\n');

/** Minimal flag parser. */
function parseArgs(argv) {
  const opts = {
    providers: [], all: false, merge: false, byAccount: false,
    noSplit: false, report: null, list: false, help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--provider' || a === '-p') opts.providers.push(String(argv[++i] || '').toLowerCase());
    else if (a === '--all' || a === '-a') opts.all = true;
    else if (a === '--single' || a === '-s' || a === '--combined' || a === '-c') opts.merge = true;
    else if (a === '--by-account') opts.byAccount = true;
    else if (a === '--no-split') opts.noSplit = true;
    else if (a === '--report') opts.report = String(argv[++i] || '').toLowerCase();
    else if (a === '--list' || a === '-l') opts.list = true;
    else if (a === '-h' || a === '--help') opts.help = true;
    else if (a.startsWith('-')) {
      console.error('Unknown option: ' + a + '\n');
      console.error(HELP);
      process.exit(2);
    }
  }
  return opts;
}

/** Writes a CSV, turning Windows file locks into a readable message. */
function writeCSV(file, records) {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  try {
    fs.writeFileSync(file, toCSV(OUTPUT_HEADERS, OUTPUT_KEYS, records));
  } catch (err) {
    if (err.code === 'EBUSY' || err.code === 'EPERM') {
      throw new Error(
        'Cannot write ' + path.relative(ROOT, file) + ' — the file is open in ' +
        'another program (usually Excel). Close it and run again.'
      );
    }
    throw err;
  }
}

/**
 * Writes one record set as monthly CSVs (or a single file with --no-split).
 * @returns {Array} report entries, one per file written
 */
function writeSet(baseName, records, opts) {
  const entries = [];
  if (!records.length) {
    console.log('\n' + baseName + ': no transactions to write.');
    return entries;
  }

  const chunks = opts.noSplit ? [{ month: null, records }] : groupByMonth(records);

  for (const chunk of chunks) {
    const name = chunk.month ? baseName + '-' + chunk.month : baseName;
    const file = path.join(OUTPUT_DIR, name + '.csv');
    writeCSV(file, chunk.records);
    entries.push(Object.assign({
      file: path.relative(ROOT, file),
      month: chunk.month,
    }, summarize(chunk.records)));
  }
  return entries;
}

/** Prints a per-file list plus category totals for the whole set. */
function printSummary(title, records, fileEntries) {
  const s = summarize(records);
  console.log('\n' + title + ': ' + s.total + ' transactions (' +
    s.categorized + ' categorized, ' + (s.total - s.categorized) + ' blank)');

  if (fileEntries.length > 1) {
    console.log('  Files:');
    for (const e of fileEntries) {
      console.log('    ' + e.file + '  (' + e.total + ' rows)');
    }
  }

  console.log('  Categories:');
  for (const item of s.byCategory) {
    console.log('  ' + String(item.count).padStart(5) + '  ' + item.name);
  }
  if (s.uncategorized.length) {
    console.log('\n  Uncategorized descriptions:');
    for (const item of s.uncategorized) {
      console.log('  ' + String(item.count).padStart(5) + '  ' + item.name);
    }
  }
}

/** Groups run results into output sets according to the chosen mode. */
function buildSets(results, opts) {
  if (opts.merge) {
    const all = results.flatMap(r => r.records);
    all.sort((a, b) => (a._iso || '').localeCompare(b._iso || ''));
    return [{ name: 'combined', title: 'Combined', records: all }];
  }

  const groups = new Map();
  for (const r of results) {
    // Default: one set per platform. --by-account keeps accounts separate.
    const key = opts.byAccount
      ? r.provider.key
      : (r.provider.platform || r.provider.key);
    if (!groups.has(key)) groups.set(key, { name: key, title: key, records: [] });
    groups.get(key).records.push(...r.records);
  }

  return [...groups.values()].map(set => {
    set.records.sort((a, b) => (a._iso || '').localeCompare(b._iso || ''));
    return set;
  });
}

async function promptChoice(found) {
  console.log('\nDetected accounts:');
  found.forEach((e, i) => {
    const plural = e.sources.length === 1 ? '' : 's';
    console.log('  ' + (i + 1) + ') ' + e.provider.displayName +
      '  (' + e.sources.length + ' file' + plural + ')');
  });
  console.log('  a) All accounts — one CSV per platform per month');
  console.log('  s) All accounts — one merged CSV per month');
  console.log('  q) Quit');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise(res => rl.question('\nChoose: ', res));
  rl.close();

  const choice = String(answer).trim().toLowerCase();
  if (choice === 'q' || choice === '') return null;
  if (choice === 'a') return { entries: found, merge: false };
  if (choice === 's' || choice === 'c') return { entries: found, merge: true };

  const n = parseInt(choice, 10);
  if (n >= 1 && n <= found.length) return { entries: [found[n - 1]], merge: false };

  console.error('Invalid choice.');
  return null;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) { console.log(HELP); return; }

  const { found, unknown, looseFiles, rerouted } = discover(DATA_DIR);

  if (unknown.length) {
    console.warn('Note: ignoring unrecognized data folder(s): ' + unknown.join(', '));
    console.warn('      Known folders: ' + providers.folderNames().join(', '));
  }
  for (const r of rerouted) {
    console.log('Routed ' + r.file + ' from data/' + r.folder +
      '/ to the ' + r.to + ' account (matched by filename).');
  }
  if (looseFiles.length) {
    console.warn('Note: ' + looseFiles.length + ' CSV file(s) sit directly in data/ and were ignored.');
    console.warn('      Move them into an account folder, e.g. data/sofi/');
  }

  if (opts.list) {
    if (!found.length) console.log('No account data found.');
    for (const e of found) {
      console.log(e.provider.key + '\t' + e.provider.displayName + '\t' +
        e.sources.length + ' file(s)');
    }
    return;
  }

  if (!found.length) {
    console.error('No account data found under ' + path.relative(ROOT, DATA_DIR) + '/.');
    console.error('Create a folder per platform and put CSV exports inside, e.g.:');
    console.error('  data/sofi/');
    process.exit(1);
  }

  // Decide what to run.
  let selection;
  if (opts.all) {
    selection = { entries: found, merge: opts.merge };
  } else if (opts.providers.length) {
    const entries = [];
    for (const key of opts.providers) {
      const adapter = providers.get(key);
      const matches = adapter
        ? found.filter(e => e.provider.key === adapter.key ||
            e.provider.platform === key)
        : found.filter(e => e.provider.platform === key);
      if (!matches.length) {
        console.error('No data found for "' + key + '". Detected: ' +
          (found.map(e => e.provider.key).join(', ') || 'none'));
        process.exit(1);
      }
      for (const m of matches) if (!entries.includes(m)) entries.push(m);
    }
    selection = { entries, merge: opts.merge };
  } else {
    selection = await promptChoice(found);
    if (!selection) return;
  }

  // Run each selected account.
  const results = [];
  for (const entry of selection.entries) {
    const result = runProvider(entry);
    for (const f of result.stats.files) {
      console.log('  read ' + f.rows + ' rows from ' + entry.provider.key + '/' + f.file);
    }
    if (result.stats.filtered) {
      console.log('  (' + result.stats.filtered + ' rows filtered out by ' +
        entry.provider.key + ' include-list)');
    }
    if (result.stats.duplicates) {
      console.log('  (' + result.stats.duplicates + ' duplicate rows skipped)');
    }
    results.push(result);
  }

  const runOpts = Object.assign({}, opts, { merge: selection.merge });
  const sets = buildSets(results, runOpts);

  const report = {
    generatedAt: new Date().toISOString(),
    mode: selection.merge ? 'merged' : (opts.byAccount ? 'by-account' : 'by-platform'),
    split: opts.noSplit ? 'none' : 'month',
    files: [],
    accounts: [],
  };

  let grandTotal = 0;
  for (const set of sets) {
    const written = writeSet(set.name, set.records, runOpts);
    printSummary(set.title, set.records, written);
    report.files.push(...written.map(e => Object.assign({ set: set.name }, e)));
    grandTotal += set.records.length;
  }

  console.log('\nWrote ' + grandTotal + ' transactions across ' +
    report.files.length + ' file(s).');

  report.accounts = results.map(r => ({
    key: r.provider.key,
    platform: r.provider.platform || r.provider.key,
    total: r.stats.total,
    duplicates: r.stats.duplicates,
    filtered: r.stats.filtered,
  }));

  if (opts.report === 'json') {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const rf = path.join(OUTPUT_DIR, 'report.json');
    fs.writeFileSync(rf, JSON.stringify(report, null, 2));
    console.log('Wrote report to ' + path.relative(ROOT, rf));
  }
}

main().catch(err => { console.error('\nError: ' + err.message); process.exit(1); });
