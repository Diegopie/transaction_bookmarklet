/**
 * @file transform.js
 * @description Field-level transforms that reproduce the bookmarklet's output rules,
 * adapted to read from SoFi's raw CSV export instead of the DOM.
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

/**
 * Formats a date to M/D/YYYY. Handles SoFi's ISO "YYYY-MM-DD" plus the legacy
 * "Month D, YYYY" and "Mon D" formats the bookmarklet supported.
 */
function formatDate(dateString) {
  const str = String(dateString).trim();

  // SoFi export format: "2026-06-24"
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (m) {
    const [, year, month, day] = m;
    return `${parseInt(month, 10)}/${parseInt(day, 10)}/${year}`;
  }

  // "November 22, 2025"
  if (/^[A-Za-z]+\s+\d{1,2},\s+\d{4}$/.test(str)) {
    const parts = str.split(' ');
    const day = parts[1].replace(',', '');
    const idx = MONTH_NAMES.findIndex(name => parts[0].startsWith(name));
    if (idx !== -1) return `${idx + 1}/${day}/${parts[2]}`;
  }

  // "May 29" (no year) — fall back to current year
  if (/^[A-Za-z]{3}\s\d{1,2}$/.test(str)) {
    const [month, day] = str.split(' ');
    const idx = MONTH_ABBR.findIndex(name => month.startsWith(name));
    if (idx !== -1) return `${idx + 1}/${day}/${new Date().getFullYear()}`;
  }

  return str;
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

/** Inverts the sign of an amount (expenses become positive, deposits negative). */
function transformAmount(amountString) {
  let clean = String(amountString).replace(/[$,]/g, '');
  const isNegative = clean.startsWith('-') ||
    (clean.startsWith('(') && clean.endsWith(')'));
  clean = clean.replace(/[()+-]/g, '');
  const amount = parseFloat(clean);
  return isNegative ? amount.toFixed(2) : (-amount).toFixed(2);
}

/**
 * Maps one raw SoFi record to the bookmarklet's output shape.
 * @param {{date:string, description:string, amount:string, status:string}} raw
 * @returns {{description:string, account:string, date:string, category:string, amount:string}}
 */
function transformRecord(raw) {
  const isPending = String(raw.status).trim().toLowerCase() === 'pending';
  return {
    description: transformDescription(raw.description),
    account: "Sofi",
    date: formatDate(raw.date),
    category: isPending ? "Pending" : determineCategory(raw.description),
    amount: transformAmount(raw.amount),
  };
}

module.exports = {
  transformDescription,
  formatDate,
  determineCategory,
  transformAmount,
  transformRecord,
};
