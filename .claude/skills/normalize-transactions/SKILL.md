---
name: normalize-transactions
description: Run this repo's CLI to convert bank and credit-card CSV exports into the budget spreadsheet format, then review uncategorized merchants and propose category mapping updates. Use when asked to run the converter, normalize or convert transactions, catch up the budget, process a SoFi (or other bank) export, or add/fix category mappings.
---

# Normalize transactions

Converts raw bank/card CSV exports in `data/<provider>/` into the budget-spreadsheet
format (`Description, Account, Date, Category, Amount`) written to `output/`.

**The CLI does the categorizing. You only curate the mapping table.** Never classify a
transaction yourself in chat — that would make results vary run to run. The whole point
is that the same input always produces the same output.

## Hard rules

1. **Never run bare `node convert.js`.** It opens an interactive menu you cannot answer.
   Always pass explicit flags.
2. **Never edit `lib/mappings.js` without the user approving the exact changes first.**
   Propose, wait for approval, then edit.
3. **Never run any git command without asking permission first** — including
   `git status`, `git add`, `git commit`, `git push`, and `git pull`. This repo pushes
   directly to `main`, so a surprise commit or push can cause conflicts. Ask, get a
   clear yes, then run.
4. **Only touch files inside this repo.** Do not look in Downloads, Desktop, or anywhere
   outside the project — not even to be helpful. If an export is in the wrong place,
   tell the user where to save it and let them move it.

## Step 1 — See what data is available

```bash
node convert.js --list
```

If it reports no data, tell the user where to put the file — do not go looking for it:

> I don't see any exports yet. Download the CSV from SoFi and save it into the
> `data/sofi/` folder in this project, then tell me and I'll run it.

Each platform has its own folder (`data/sofi/`, `data/amex/`, ...). A CSV sitting loose
in `data/` is ignored; it must be inside a platform folder.

Multiple exports can share a folder — SoFi checking and savings both go in `data/sofi/`
and are routed by filename. If the run prints a "Routed ..." line, that is normal and
worth repeating to the user so they can confirm the file landed on the right account.

## Step 2 — Run the conversion

Pick the mode from what the user asked for:

| They want | Command |
|---|---|
| The normal run — each platform separate | `node convert.js --all --report json` |
| Everything merged into one sheet per month | `node convert.js --all --single --report json` |
| Just one platform or account | `node convert.js --provider sofi --report json` |

Always include `--report json`. It writes `output/report.json`, which you should read
instead of parsing the console output.

**Output is always one CSV per calendar month.** By default each platform gets its own
set (`output/sofi-2026-07.csv`, `output/amex-2026-07.csv`); `--single` merges every
platform into `output/combined-2026-07.csv` etc. Accounts on the same platform (SoFi
checking and savings) share a file and are told apart by the `Account` column.

Tell the user which files to paste, and mention the month each covers — they paste
month by month into the spreadsheet.

## Step 3 — Report the results

Read `output/report.json` and tell the user:

- How many transactions were converted, and which file to paste into the spreadsheet.
- The category breakdown (brief — a table or short list).
- How many rows came out uncategorized.

Keep it short and non-technical. The person running this may just want to know "is it
ready to paste, and does anything need my attention?"

## Step 4 — Propose mapping updates

`report.json` lists uncategorized descriptions with counts. Review them and propose
additions to `lib/mappings.js`, but **only suggest ones you're reasonably confident
about** — a recognizable merchant chain, or something that recurs several times.

Good candidates to propose:
- Recognizable chains (`STARBUCKS` -> Coffee, `SMITHS` -> Groceries)
- Anything appearing 3+ times, since it will keep showing up
- Existing keywords that missed due to **punctuation** — this is a known trap:
  `WENDYS` does not match `WENDY'S`; `WALMART` does not match `WAL-MART`. Prefer the
  shortest distinctive stem (`WENDY`) or add both spellings.

Do **not** propose:
- One-off purchases that won't recur (travel, a single odd charge)
- Peer-to-peer payments — Venmo, MetaPay, PayPal are intentionally left blank
- Anything where you'd be guessing what the merchant is. Ask instead.

Present proposals as a short table (description -> proposed category) and ask for
approval. Categorization is personal: past decisions included restaurants as
`Eating Out` (not `Food`), SoFi Vaults as `Savings`, `From Savings` as `Transfer`,
Walgreens as `Snacks`, and Venmo left blank. Respect those precedents.

### Applying approved changes

Mapping rules in `lib/mappings.js`:
- `descriptionKeywords` — keyword to a cleaner display name
- `categoryKeywords` — keyword to a category
- `allowedCategories` — a category not in this list is silently ignored, so if you
  introduce a new category name you must add it here too
- Matching is **case-insensitive, first-match-wins in insertion order** — list specific
  keywords before general ones (`COSTCO GAS` before `COSTCO`)

After editing, re-run the same command and confirm the newly mapped rows picked up
their categories.

## Step 5 — Offer to commit (always ask)

Mapping changes are tracked in git. After applying approved edits, ask whether to
commit and push — never do it unprompted:

> I've updated the mappings. Want me to commit and push these to `main`?

Only if they say yes, ask permission to run the git commands, then commit with a short
message describing the mapping change. If anything looks like a conflict or the branch
has diverged, stop and report it rather than resolving it yourself.

Note: `data/` and `output/` are git-ignored, so real transaction data is never
committed — only the mapping rules.

## Troubleshooting

**"Cannot write output/....csv — the file is open in another program"**
The CSV is open in Excel. Tell the user to close it, then re-run. This happens often.

**"not a SoFi export (missing ... column)"**
The file isn't the right provider's format, or the bank changed their export layout.
Check the header row against `lib/providers/<provider>.js` and report what you found —
don't silently work around it.

**"ignoring unrecognized data folder"**
There's a folder under `data/` with no matching provider adapter. Supported providers
are registered in `lib/providers/index.js`. Adding one means a new adapter file — see
the README's "Adding a provider" section. Confirm with the user before writing a new
adapter, and note that the `outflowSign` setting must be verified against a real
charge (banks use negative for outflows, credit cards usually positive).

**Numbers look inverted for a provider**
That provider's `outflowSign` is wrong. Expenses should come out **positive** and
deposits **negative** in the output.
