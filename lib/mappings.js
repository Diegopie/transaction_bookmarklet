/**
 * @file mappings.js
 * @description Keyword mappings for cleaning descriptions and assigning categories.
 * This is the single source of truth for the CSV converter — edit here and re-run.
 *
 * Matching is case-insensitive and FIRST-MATCH-WINS in insertion order, so list
 * more specific keywords before more general ones (e.g. "COSTCO GAS" before "COSTCO").
 */

/** Maps keywords found in raw descriptions to cleaner display descriptions. */
const descriptionKeywords = {
  "Roundup": "Roundup",
  // Amazon (Prime Video listed first so "AMAZON PRIME" resolves to the streaming label)
  "Prime Video": "Amazon Prime Video",
  "AMAZON": "Amazon",
  "AMZN": "Amazon",
  // Warehouse / groceries (COSTCO GAS before COSTCO)
  "COSTCO GAS": "Costco Gas",
  "COSTCO": "Costco",
  "WALMART": "Walmart",
  "HARMONS": "Harmons",
  // Coffee
  "BEANS & BREWS": "Beans & Brews",
  "DUTCH BROS": "Dutch Bros",
  // Eating out
  "CHICK-FIL-A": "Chick-fil-A",
  "LA PUENTE": "La Puente",
  "SHAKE SHACK": "Shake Shack",
  "WENDYS": "Wendy's",
  "DOMINO": "Domino's",
  "IN-N-OUT": "In-N-Out",
  "VIA 313": "Via 313",
  "ICE HAUS": "Ice Haus",
  "TROPICAL SMOOTHIE": "Tropical Smoothie Cafe",
  "SLACKWATER": "Slackwater",
  "HELADERIA OLMO": "Heladeria Olmo",
  "LA XURRE": "La Xurre",
  // Transportation
  "MAVERIK": "Maverik",
  "CHEVRON": "Chevron",
  "BIG O": "Big O Tires",
  "UBER": "Uber",
  // Entertainment / subscriptions
  "MEGAPLEX": "Megaplex Theaters",
  "NETFLIX": "Netflix",
  "SPOTIFY": "Spotify",
  "HBOMAX": "HBO Max",
  "APPLE.COM": "Apple",
  // Bills / utilities
  "T-MOBILE": "T-Mobile",
  "ENBRIDGE": "Enbridge Gas",
  "ROCKYMTN": "Rocky Mountain Power",
  // Card payments
  "AMEX": "American Express",
  "CITI AUTOPAY": "Citi",
  "DISCOVER": "Discover",
  "CAPITAL ONE": "Capital One",
  "BANK OF AMERICA": "Bank of America",
  // Shopping
  "T.J. MAXX": "T.J. Maxx",
  // Snacks
  "WALGREENS": "Walgreens",
  // Income
  "Butter Software": "Butter Software",
  // Add more mappings as needed
};

/** Maps keywords found in descriptions to a category from allowedCategories. */
const categoryKeywords = {
  // Savings — SoFi Vaults are savings buckets
  "Vault": "Savings",
  "Roundup": "Savings",
  // Transfer (internal account movement)
  "From Savings": "Transfer",
  // Snacks
  "WALGREENS": "Snacks",
  // Groceries
  "HARMONS": "Groceries",
  "COSTCO GAS": "Transportation", // must precede COSTCO
  "COSTCO": "Groceries",
  "WALMART": "Groceries",
  // Transportation
  "MAVERIK": "Transportation",
  "CHEVRON": "Transportation",
  "BIG O": "Transportation",
  "UBER": "Transportation",
  // Shopping
  "AMAZON": "Shopping",
  "AMZN": "Shopping",
  "T.J. MAXX": "Shopping",
  // Coffee
  "BEANS & BREWS": "Coffee",
  "DUTCH BROS": "Coffee",
  // Eating out (Prime Video listed above Amazon so streaming wins)
  "Prime Video": "Entertainment",
  "CHICK-FIL-A": "Eating Out",
  "LA PUENTE": "Eating Out",
  "SHAKE SHACK": "Eating Out",
  "WENDYS": "Eating Out",
  "DOMINO": "Eating Out",
  "IN-N-OUT": "Eating Out",
  "VIA 313": "Eating Out",
  "ICE HAUS": "Eating Out",
  "HOUSTON S HOT CHI": "Eating Out",
  "TROPICAL SMOOTHIE": "Eating Out",
  "EL YANTAR": "Eating Out",
  "LA XURRE": "Eating Out",
  "SLACKWATER": "Eating Out",
  "BEATA PASTA": "Eating Out",
  "BAR CAROLINES": "Eating Out",
  "HELADERIA": "Eating Out",
  "HOT DOG": "Eating Out",
  "TACOS": "Eating Out",
  // Entertainment / streaming
  "MEGAPLEX": "Entertainment",
  "NETFLIX": "Entertainment",
  "SPOTIFY": "Entertainment",
  "HBOMAX": "Entertainment",
  // Subscriptions
  "APPLE.COM": "Subscription",
  // Bills / utilities
  "T-MOBILE": "Bills",
  "ENBRIDGE": "Bills",
  "ROCKYMTN": "Bills",
  "CITY OF WEST JOR": "Bills",
  // Card payments / debt
  "AMEX": "Debt",
  "CITI AUTOPAY": "Debt",
  "DISCOVER": "Debt",
  "CAPITAL ONE": "Debt",
  "BANK OF AMERICA": "Debt",
  // Income
  "Butter Software": "Income",
  // Add more mappings as needed
};

/** Categories that determineCategory is allowed to emit. */
const allowedCategories = [
  "Income", "Other", "Bills", "Debt", "Business", "Freelance",
  "Membership", "Subscription", "Snacks", "Coffee", "Food", "Eating Out",
  "Entertainment", "Groceries", "Shopping", "Transportation", "Misc",
  "Transfer", "Savings", "Pending"
];

module.exports = { descriptionKeywords, categoryKeywords, allowedCategories };
