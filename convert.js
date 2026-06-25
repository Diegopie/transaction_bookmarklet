#!/usr/bin/env node
/**
 * @file convert.js
 * @description Reads every SoFi CSV export in data/, merges them, and writes a single
 * converted CSV (output/transactions.csv) in the same format the old bookmarklet produced:
 *   Description, Account, Date (M/D/YYYY), Category, Amount (sign inverted)
 *
 * Usage: node convert.js   (or: npm run convert)
 */

const fs = require('fs');
const path = require('path');
const { parseCSV, toCSV } = require('./lib/csv');
const { transformRecord } = require('./lib/transform');

const DATA_DIR = path.join(__dirname, 'data');
const OUTPUT_DIR = path.join(__dirname, 'output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'transactions.csv');

// Output column order (matches the bookmarklet) and the record keys backing each.
const OUTPUT_HEADERS = ["Description", "Account", "Date", "Category", "Amount"];
const OUTPUT_KEYS = ["description", "account", "date", "category", "amount"];

/** Finds a column index by header name (case-insensitive); -1 if absent. */
function colIndex(header, name) {
  return header.findIndex(h => h.trim().toLowerCase() === name.toLowerCase());
}

/** Parses one SoFi CSV file into raw records keyed by what the transform needs. */
function readSofiFile(filePath) {
  const rows = parseCSV(fs.readFileSync(filePath, 'utf8'));
  if (rows.length < 2) return [];

  const header = rows[0];
  const idx = {
    date: colIndex(header, 'Date'),
    description: colIndex(header, 'Description'),
    amount: colIndex(header, 'Amount'),
    balance: colIndex(header, 'Current balance'),
    status: colIndex(header, 'Status'),
  };

  if (idx.date === -1 || idx.description === -1 || idx.amount === -1) {
    throw new Error(`${path.basename(filePath)}: missing required Date/Description/Amount columns`);
  }

  const records = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length === 1 && r[0].trim() === '') continue; // skip blank lines
    records.push({
      date: (r[idx.date] || '').trim(),
      description: (r[idx.description] || '').trim(),
      amount: (r[idx.amount] || '').trim(),
      balance: idx.balance === -1 ? '' : (r[idx.balance] || '').trim(),
      status: idx.status === -1 ? '' : (r[idx.status] || '').trim(),
    });
  }
  return records;
}

function main() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error(`No data/ directory found at ${DATA_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.toLowerCase().endsWith('.csv'))
    .sort();

  if (files.length === 0) {
    console.error('No .csv files found in data/');
    process.exit(1);
  }

  // Gather raw records from all files, de-duplicating exact repeats across exports.
  const seen = new Set();
  const raw = [];
  let duplicates = 0;
  for (const file of files) {
    const records = readSofiFile(path.join(DATA_DIR, file));
    for (const rec of records) {
      const key = `${rec.date}|${rec.description}|${rec.amount}|${rec.balance}`;
      if (seen.has(key)) { duplicates++; continue; }
      seen.add(key);
      raw.push(rec);
    }
    console.log(`  read ${records.length} rows from ${file}`);
  }

  // Match the bookmarklet's ordering: reverse (exports are newest-first), then a
  // stable sort by date puts everything oldest-first across merged files.
  raw.reverse();
  raw.sort((a, b) => a.date.localeCompare(b.date)); // ISO YYYY-MM-DD sorts lexically

  const output = raw.map(transformRecord);

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, toCSV(OUTPUT_HEADERS, OUTPUT_KEYS, output));

  console.log(`\nWrote ${output.length} transactions to ${path.relative(__dirname, OUTPUT_FILE)}` +
    (duplicates ? ` (${duplicates} duplicate rows skipped)` : ''));
}

main();
