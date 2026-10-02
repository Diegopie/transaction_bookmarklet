/**
 * @file sofi-savings.js
 * @description SoFi savings account.
 *
 * The savings export is mostly interest and internal vault movement we don't want
 * in the budget, so only the transactions listed in includeOnlyDescriptions are
 * kept. Everything else in the file is dropped (and counted as "filtered out" in
 * the run summary, so nothing disappears silently).
 */

const base = require('./sofi-base');

module.exports = Object.assign({}, base, {
  key: 'sofi-savings',
  displayName: 'SoFi Savings',
  label: 'Sofi Savings',

  /** Output grouping: all accounts sharing a platform land in one CSV. */
  platform: 'sofi',

  /**
   * Keep ONLY rows whose description contains one of these (case-insensitive).
   * Add more strings here to let more savings transactions through.
   */
  includeOnlyDescriptions: ['DESERET BOOK COM'],

  /** Routed by filename even if it sits in data/sofi/ alongside checking. */
  filePatterns: ['JointSavings', 'Savings'],
});
