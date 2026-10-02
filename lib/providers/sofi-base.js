/**
 * @file sofi-base.js
 * @description Shared CSV schema for all SoFi exports (checking and savings use
 * the same download format). Account-specific adapters spread this and override.
 *
 * Sample header:
 *   Date,Description,Type,Amount,Current balance,Status
 *   2026-08-13,To Travel Vault,WITHDRAWAL,-0.91,5398.92,Posted
 */

module.exports = {
  requiredHeaders: ['Date', 'Description', 'Amount'],

  columns: {
    date: 'Date',
    description: 'Description',
    amount: 'Amount',
    status: 'Status',
    // Used only to disambiguate otherwise-identical rows when de-duplicating.
    balance: 'Current balance',
  },

  /** SoFi writes ISO dates. */
  dateFormat: 'iso',

  /** SoFi is a bank: withdrawals are negative numbers. */
  outflowSign: 'negative',

  /** Rows are newest-first in the export. */
  newestFirst: true,
};
