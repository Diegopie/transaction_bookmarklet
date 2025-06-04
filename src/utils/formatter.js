/**
 * @file formatter.js
 * @description Utility functions for formatting and transforming data
 */

/**
 * Transforms a description using keyword mapping
 * @param {string} originalDescription - Original transaction description
 * @returns {string} - Transformed description
 */
function transformDescription(originalDescription) {
  // Check if any keywords match
  for (const keyword in descriptionKeywords) {
    if (originalDescription.includes(keyword)) {
      return descriptionKeywords[keyword];
    }
  }
  
  // If no keywords match, use original
  return originalDescription;
}

/**
 * Formats a date string to M/D/YYYY format
 * @param {string} dateString - Date string from the bank page
 * @returns {string} - Formatted date string
 */
function formatDate(dateString) {
  // Handle different date formats that might be in the HTML
  
  // Format: "May 29" -> Need to add year
  if (/^[A-Za-z]{3}\s\d{1,2}$/.test(dateString)) {
    const currentYear = new Date().getFullYear();
    const [month, day] = dateString.split(' ');
    
    // Convert month name to month number
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIndex = monthNames.findIndex(m => month.startsWith(m));
    
    if (monthIndex !== -1) {
      return `${monthIndex + 1}/${day}/${currentYear}`;
    }
  }
  
  // If we couldn't parse it, return original
  return dateString;
}

/**
 * Determines the category of a transaction based on its description
 * @param {string} description - Transaction description
 * @returns {string} - Category name or empty string if no match
 */
function determineCategory(description) {
  // Check if any keywords match
  for (const keyword in categoryKeywords) {
    if (description.includes(keyword)) {
      const category = categoryKeywords[keyword];
      
      // Ensure the category is in the allowed list
      if (allowedCategories.includes(category)) {
        return category;
      }
    }
  }
  
  // If no matches, return empty string
  return "";
}

/**
 * Transforms the amount by inverting the sign
 * @param {string} amountString - Original amount string from the bank page
 * @returns {string} - Transformed amount as string with fixed decimal places
 */
function transformAmount(amountString) {
  // Remove currency symbols, commas, and parentheses
  let cleanAmount = amountString.replace(/[$,]/g, '');
  
  // Check if it's negative (either has - prefix or is in parentheses)
  const isNegative = cleanAmount.startsWith('-') || 
                    (cleanAmount.startsWith('(') && cleanAmount.endsWith(')'));
  
  // Remove any remaining special characters
  cleanAmount = cleanAmount.replace(/[()+-]/g, '');
  
  // Parse as float for proper number handling
  let amount = parseFloat(cleanAmount);
  
  // Invert sign as per requirement
  if (isNegative) {
    // If original was negative, make it positive
    return amount.toFixed(2);
  } else {
    // If original was positive, make it negative
    return (-amount).toFixed(2);
  }
}

/**
 * Escapes special characters for CSV format
 * @param {*} field - Field value to escape
 * @returns {string} - Properly escaped field for CSV
 */
function escapeCSVField(field) {
  if (field === null || field === undefined) {
    return '""';
  }
  
  // Convert to string and check if it needs escaping
  const stringField = String(field);
  
  // If field contains commas, quotes, or newlines, wrap in quotes and escape quotes
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    // Replace quotes with double quotes (CSV escaping)
    return '"' + stringField.replace(/"/g, '""') + '"';
  }
  
  return stringField;
}
