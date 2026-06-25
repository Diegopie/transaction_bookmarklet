/**
 * @file csv.js
 * @description Minimal RFC-4180-ish CSV parsing and serialization (no dependencies).
 */

/**
 * Parses CSV text into an array of string-arrays (one per row).
 * Handles quoted fields, embedded commas/newlines, escaped quotes (""), and CRLF.
 * @param {string} text
 * @returns {string[][]}
 */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  // Strip a leading UTF-8 BOM if present.
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') { inQuotes = true; }
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\r') { /* ignore, handled by \n */ }
    else if (char === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else { field += char; }
  }

  // Flush trailing field/row if the file doesn't end with a newline.
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }

  return rows;
}

/** Escapes a single CSV field, quoting only when necessary. */
function escapeField(field) {
  if (field === null || field === undefined) return '';
  const str = String(field);
  if (/[",\n]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
  return str;
}

/**
 * Serializes header + record objects into CSV text.
 * @param {string[]} headers - column titles, in order
 * @param {string[]} keys - object keys matching each header
 * @param {Object[]} records
 * @returns {string}
 */
function toCSV(headers, keys, records) {
  const lines = [headers.map(escapeField).join(',')];
  for (const rec of records) {
    lines.push(keys.map(k => escapeField(rec[k])).join(','));
  }
  return lines.join('\n') + '\n';
}

module.exports = { parseCSV, escapeField, toCSV };
