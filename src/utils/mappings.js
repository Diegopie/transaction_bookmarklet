/**
 * @file mappings.js
 * @description Contains keyword mappings for transforming descriptions and categorizing transactions
 */

/**
 * Maps keywords found in original descriptions to cleaner descriptions
 * @type {Object.<string, string>}
 */
const descriptionKeywords = {
  "Roundup": "Roundup",
  "AMAZON": "Amazon",
  "AMZN": "Amazon",
  "COSTCO": "Costco",
  "WALMART": "Walmart",
  "CHICK-FIL-A": "Chick-fil-A",
  "LA PUENTE": "La Puente",
  "Prime Video": "Amazon Prime Video",
  "MEGAPLEX": "Megaplex Theaters",
  "BEANS & BREWS": "Bean",
  // Add more mappings as needed
};

/**
 * Maps keywords found in descriptions to specific categories
 * @type {Object.<string, string>}
 */
const categoryKeywords = {
  "COSTCO": "Groceries",
  "WALMART": "Groceries",
  "AMAZON": "Shopping",
  "AMZN": "Shopping",
  "CHICK-FIL-A": "Food",
  "LA PUENTE": "Food",
  "Prime Video": "Entertainment",
  "MEGAPLEX": "Entertainment",
  "HOT DOG": "Food",
  "TACOS": "Food",
  "Roundup": "Savings",
  "BEANS & BREWS": "Coffee",
  // Add more mappings as needed
};

/**
 * List of allowed categories for transactions
 * @type {Array.<string>}
 */
const allowedCategories = [
  "Income", "Other", "Bills", "Debt", "Business", "Freelance", 
  "Membership", "Subscription", "Snacks", "Coffee", "Food", 
  "Entertainment", "Groceries", "Transportation", "Misc", 
  "Transfer", "Savings", "Pending"
];
