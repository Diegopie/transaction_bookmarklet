/**
 * @file sofi-checking.js
 * @description SoFi checking account. Every transaction is kept.
 */

const base = require('./sofi-base');

module.exports = Object.assign({}, base, {
  key: 'sofi-checking',
  displayName: 'SoFi Checking',
  label: 'Sofi',

  /** Output grouping: all accounts sharing a platform land in one CSV. */
  platform: 'sofi',

  /** data/sofi/ also resolves here, so the original folder name keeps working. */
  aliases: ['sofi'],

  /**
   * SoFi names its exports after the account, so a file can be routed even when
   * checking and savings exports share one folder.
   */
  filePatterns: ['JointChecking', 'Checking'],
});
