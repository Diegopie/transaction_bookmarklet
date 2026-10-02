# Transaction Normalizer

A Node.js CLI that reads raw CSV exports from banks and credit cards and normalizes
them into one consistent format for our budget spreadsheet — cleaning up merchant
descriptions, assigning categories, and putting every provider's amounts on the same
sign convention.

> This started as a browser bookmarklet that scraped the SoFi transactions page.
> SoFi now offers a direct CSV download, so it was rewritten to read exports, then
> generalized to support any provider. The original bookmarklet is kept for
> reference (see [Legacy bookmarklet](#legacy-bookmarklet)).

## How it works

1. Drop each provider's CSV exports into its own folder under `data/`.
2. Run the CLI and pick what to convert.
3. Normalized CSVs land in `output/`.

```
data/
  sofi/   SOFI-JointChecking-2026-09-17.csv
  amex/   activity.csv
  citi/   ...
```

```bash
npm run convert              # interactive menu
npm run convert:all          # one CSV per platform per month
npm run convert:single       # all platforms merged, one CSV per month
```

## CLI reference

```
node convert.js                     Interactive menu
node convert.js --all               Every platform, its own CSV per month
node convert.js --all --single      All platforms merged, one CSV per month
node convert.js --provider sofi     Just one account
node convert.js --list              Show detected accounts and exit
node convert.js --report json       Also write output/report.json
node convert.js --help
```

Bare `node convert.js` prompts interactively — good for running by hand. The flags
give the same behavior deterministically, which is what scripts and the Claude skill
should use.

## Output layout

Output is **always split into one CSV per calendar month**, matching the monthly
layout of the budget spreadsheet.

| Mode | Files |
|---|---|
| Default | One set per **platform**: `sofi-2026-07.csv`, `amex-2026-07.csv`, ... |
| `--single` | Everything merged: `combined-2026-07.csv`, ... |
| `--by-account` | One set per account: `sofi-checking-2026-07.csv`, `sofi-savings-2026-07.csv` |
| `--no-split` | One file for the whole date range instead of per month |

Accounts that share a `platform` (SoFi checking and savings) land in the **same**
file by default, told apart by the `Account` column (`Sofi` vs `Sofi Savings`). Use
`--single` to get one sheet per month covering every platform at once.

## Output format

Five columns, pasted straight into the budget spreadsheet:

| # | Column | Notes |
|---|-------------|-------|
| 1 | Description | Cleaned via keyword mapping (`AMAZON MKTPLACE PMTS` -> `Amazon`) |
| 2 | Account | The provider's label (e.g. `Sofi`) |
| 3 | Date | `M/D/YYYY` |
| 4 | Category | From keyword mapping; `Pending` if the row's status is pending; blank if no match |
| 5 | Amount | **Expenses positive, deposits negative** |

Rows are ordered oldest-first.

## Adding a provider

Create `lib/providers/<key>.js` and register it in `lib/providers/index.js`. Nothing
else changes — the rest of the pipeline is provider-agnostic.

```javascript
module.exports = {
  key: 'amex',                 // folder name under data/ and --provider value
  displayName: 'American Express',
  label: 'Amex',               // goes in the Account column
  platform: 'amex',            // output grouping — shared key = shared CSV
  requiredHeaders: ['Date', 'Description', 'Amount'],
  columns: {
    date: 'Date', description: 'Description',
    amount: 'Amount', status: 'Status', balance: null,
  },
  dateFormat: 'us',            // 'iso' | 'us' | 'auto'
  outflowSign: 'positive',     // see below
  newestFirst: true,

  // Optional:
  aliases: ['americanexpress'],        // extra accepted folder names
  filePatterns: ['amex', 'activity'],  // route by filename, see below
  includeOnlyDescriptions: [],         // keep ONLY matching rows
};
```

### Multiple accounts on one platform

SoFi has checking and savings, each its own adapter (`sofi-checking.js`,
`sofi-savings.js`) sharing `platform: 'sofi'` and a common schema in `sofi-base.js`.
They land in one `sofi-*.csv` by default, distinguished by the `Account` column.

### `filePatterns` — routing by filename

Banks name exports after the account (`SOFI-JointChecking-....csv` vs
`SOFI-JointSavings-....csv`). A file whose name matches an adapter's `filePatterns`
is routed to that adapter **regardless of which folder it sits in**, so you can drop
every export from one bank into a single folder. The run reports any reroute.

### `includeOnlyDescriptions` — filtering a noisy account

When set, only rows whose description contains one of these strings are kept.
`sofi-savings` uses it to keep just the payroll deposits and drop interest and
internal transfers — those transfers would otherwise double-count against the
matching `From Savings` rows in checking. Dropped rows are counted in the run
summary so nothing disappears silently.

### `outflowSign` — the important one

Banks and cards disagree about what a negative number means:

- **Bank/checking exports** (SoFi): withdrawals are **negative** -> `outflowSign: 'negative'`
- **Credit-card exports** (typical): a charge is a **positive** number -> `outflowSign: 'positive'`

Each adapter normalizes to one internal convention (*negative = money leaving the
account*), and the output formatter flips it once at the end. Get this wrong and a
whole statement comes out backwards, so check a known charge after adding a provider.

### `requiredHeaders`

Acts as a safety net: if a CSV in `data/amex/` doesn't have these columns, the run
fails with a clear message instead of silently producing garbage. It also catches
banks changing their export format.

## Customizing categories & descriptions

All mapping logic lives in **`lib/mappings.js`** — one shared table across every
provider, since merchants are the same wherever they're charged.

- `descriptionKeywords` — keyword -> cleaner display name
- `categoryKeywords` — keyword -> category (must be in `allowedCategories`, else ignored)
- `allowedCategories` — the whitelist of category names

Matching is **case-insensitive** and **first-match-wins in insertion order**, so list
specific keywords before general ones:

```javascript
const categoryKeywords = {
  "COSTCO GAS": "Transportation", // specific — first
  "COSTCO": "Groceries",          // general — after
};
```

Watch for punctuation: `WENDYS` will not match `WENDY'S`, and `WALMART` will not
match `WAL-MART`. Prefer the shortest distinctive stem (`WENDY`) or add both spellings.

After editing, re-run the CLI. Categorization is fully deterministic — the same input
always produces the same output.

## Project structure

```
convert.js                 # CLI entry point
lib/
  providers/
    index.js               # registry — add new accounts here
    sofi-base.js           # shared SoFi CSV schema
    sofi-checking.js       # SoFi checking
    sofi-savings.js        # SoFi savings (payroll only)
  pipeline.js              # discovery, routing, reading, de-dup, grouping
  transform.js             # date/amount/description/category transforms
  mappings.js              # keyword tables (edit this)
  csv.js                   # dependency-free CSV parse/serialize
data/<platform>/           # raw exports (git-ignored)
output/                    # generated CSVs (+ optional report.json)
.claude/skills/            # skill that drives this CLI
original/ src/ build/      # legacy bookmarklet (reference only)
```

## Requirements

Node.js (developed on v24 via nvm-windows). No runtime dependencies — the CSV parser
is self-contained.

## Gotchas

- **Close the output CSV in Excel before running.** Windows locks open files; the CLI
  reports this clearly instead of failing cryptically.
- `data/` is git-ignored, so real transaction exports are never committed.
- Loose CSVs placed directly in `data/` are ignored — they must live in a provider
  folder.

## Legacy bookmarklet

The original browser-bookmarklet implementation is preserved but no longer used:
`original/bookmarklet.js` (last working DOM version), `src/` (modular refactor), and
`build/build.js` (`npm run build` bundles it into a `javascript:` bookmarklet). Use
the CLI above unless you specifically need the in-browser version.
