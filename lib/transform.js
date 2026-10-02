/**
 * @file transform.js
 * @description Field-level transforms shared by every provider.
 *
 * Amount handling has two stages, which keeps per-bank quirks out of the output rule:
 *   1. normalizeAmount() converts a provider's raw amount to a CANONICAL number
 *      where NEGATIVE always means money leaving the account.
 *   2. formatOutputAmount() flips that once, so the spreadsheet gets expenses
 *      positive and deposits negative.
 */

const { descriptionKeywords, categoryKeywords, allowedCategories } = require('./mappings');

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Cleans a raw description via the first matching keyword, else returns it unchanged. */
function transformDescription(originalDescription) {
  const haystack = originalDescription.toLowerCase();
  for (const keyword in descriptionKeywords) {
    if (haystack.includes(keyword.toLowerCase())) {
      return descriptionKeywords[keyword];
    }
  }
  return originalDescription;
}

const pad = n => String(n).padStart(2, '0');

/**
 * Parses a date into both a sortable ISO key and the M/D/YYYY display form.
 * @param {string} value - raw date text from the export
 * @param {string} [format] - 'iso', 'us', or 'auto' (default)
 * @returns {{iso:string, display:string}} - iso is "" when unparseable
 */
function parseDate(value, format = 'auto') {
  const str = String(value).trim();
  const build = (y, m, d) => ({
    iso: `${y}-${pad(m)}-${pad(d)}`,
    display: `${parseInt(m, 10)}/${parseInt(d, 10)}/${y}`,
  });

  // ISO: "2026-06-24"
  if (format === 'iso' || format === 'auto') {
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(str);
    if (m) return build(m[1], m[2], m[3]);
  }

  // US: "6/24/2026" or "06/24/2026"
  if (format === 'us' || format === 'auto') {
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(str);
    if (m) return build(m[3], m[1], m[2]);
  }

  // "November 22, 2025"
  let m = /^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/.exec(str);
  if (m) {
    const idx = MONTH_NAMES.findIndex(name => m[1].startsWith(name));
    if (idx !== -1) return build(m[3], idx + 1, m[2]);
  }

  // "May 29" (no year) — assume current year
  m = /^([A-Za-z]{3})\s+(\d{1,2})$/.exec(str);
  if (m) {
    const idx = MONTH_ABBR.findIndex(name => m[1].startsWith(name));
    if (idx !== -1) return build(new Date().getFullYear(), idx + 1, m[2]);
  }

  return { iso: '', display: str };
}

/** Back-compat helper: returns just the M/D/YYYY display string. */
function formatDate(dateString) {
  return parseDate(dateString).display;
}

/** Returns the mapped category for a description, or "" when nothing matches. */
function determineCategory(description) {
  const haystack = description.toLowerCase();
  for (const keyword in categoryKeywords) {
    if (haystack.includes(keyword.toLowerCase())) {
      const category = categoryKeywords[keyword];
      if (allowedCategories.includes(category)) return category;
    }
  }
  return "";
}

/** Parses a raw amount string ("-$1,234.56", "(12.00)") into a signed number. */
function parseAmount(amountString) {
  let clean = String(amountString).trim().replace(/[$,\s]/g, '');
  const isNegative = clean.startsWith('-') ||
    (clean.startsWith('(') && clean.endsWith(')'));
  clean = clean.replace(/[()+-]/g, '');
  const value = parseFloat(clean);
  if (Number.isNaN(value)) return NaN;
  return isNegative ? -value : value;
}

/**
 * Converts a provider's raw amount to the canonical convention where
 * NEGATIVE = money leaving the account.
 * @param {string} amountString
 * @param {string} outflowSign - 'negative' (bank style) or 'positive' (card style)
 */
function normalizeAmount(amountString, outflowSign = 'negative') {
  const value = parseAmount(amountString);
  if (Number.isNaN(value)) return NaN;
  return outflowSign === 'positive' ? -value : value;
}

/** Flips canonical amount for output: expenses positive, deposits negative. */
function formatOutputAmount(canonical) {
  if (Number.isNaN(canonical)) return '';
  return (-canonical).toFixed(2);
}

/**
 * Back-compat: inverts a raw bank-style amount in one step.
 * Equivalent to formatOutputAmount(normalizeAmount(x, 'negative')).
 */
function transformAmount(amountString) {
  return formatOutputAmount(normalizeAmount(amountString, 'negative'));
}

/**
 * Maps one raw record to the output shape, using the provider adapter for the
 * Account label, date format, and amount sign convention.
 * @param {{date:string, description:string, amount:string, status:string}} raw
 * @param {Object} provider - adapter from lib/providers
 * @returns {{description:string, account:string, date:string, category:string, amount:string, _iso:string}}
 */
function transformRecord(raw, provider) {
  const isPending = String(raw.status || '').trim().toLowerCase() === 'pending';
  const { iso, display } = parseDate(raw.date, provider ? provider.dateFormat : 'auto');
  const canonical = normalizeAmount(raw.amount, provider ? provider.outflowSign : 'negative');

  return {
    description: transformDescription(raw.description),
    account: provider ? provider.label : 'Sofi',
    date: display,
    category: isPending ? 'Pending' : determineCategory(raw.description),
    amount: formatOutputAmount(canonical),
    /** Sortable key, not written to the CSV. */
    _iso: iso,
  };
}

module.exports = {
  transformDescription,
  parseDate,
  formatDate,
  determineCategory,
  parseAmount,
  normalizeAmount,
  formatOutputAmount,
  transformAmount,
  transformRecord,
};
