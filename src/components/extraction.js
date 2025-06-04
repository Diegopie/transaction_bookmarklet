/**
 * @file extraction.js
 * @description Functions for extracting transaction data from the bank's HTML page
 */

/**
 * Extracts all transactions from the bank's HTML page
 * @returns {Array.<Object>} - Array of transaction objects with raw data
 */
function extractTransactions() {
  const transactions = [];
  
  // Get all tables in the transactions section
  const tables = document.querySelectorAll('.transactions table.sc-gcUDKN');
  
  // Iterate through each table
  tables.forEach(table => {
    // Get the table heading text to identify the table type
    const tableHeadingElement = table.previousElementSibling;
    if (!tableHeadingElement) return; // Skip if no heading found
    
    const tableHeading = tableHeadingElement.textContent.trim();
    
    // Skip "Scheduled" transactions as per requirements
    if (tableHeading === "Scheduled") return;
    
    // Check if this is the "Pending" table
    const isPendingTable = tableHeading === "Pending";
    
    // Process all rows in the table
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const transaction = extractRowData(row, isPendingTable);
      if (transaction) {
        transactions.push(transaction);
      }
    });
  });
  
  return transactions;
}

/**
 * Extracts data from a single table row
 * @param {HTMLElement} row - Table row DOM element
 * @param {boolean} isPendingTable - Whether this row is from the Pending table
 * @returns {Object|null} - Transaction object or null if extraction failed
 */
function extractRowData(row, isPendingTable) {
  try {
    // Extract date
    const dateCell = row.querySelector('.col0');
    let dateText = "";
    
    // Get the visible date text or the hidden one
    const visibleDateSpan = dateCell.querySelector('span:not(.visually-hidden)');
    const hiddenDateSpan = dateCell.querySelector('span.visually-hidden');
    
    if (visibleDateSpan && visibleDateSpan.textContent.trim() !== "") {
      dateText = visibleDateSpan.textContent.trim();
    } else if (hiddenDateSpan) {
      dateText = hiddenDateSpan.textContent.trim();
    }
    
    // Extract description
    const descriptionCell = row.querySelector('.col1.sr-mask span');
    const description = descriptionCell ? descriptionCell.textContent.trim() : "";
    
    // Extract amount
    const amountCell = row.querySelector('.col4 span');
    const amountText = amountCell ? amountCell.textContent.trim() : "";
    
    return {
      date: dateText,
      description: description,
      amount: amountText,
      isPending: isPendingTable
    };
  } catch (error) {
    console.error("Error extracting row data:", error);
    return null;
  }
}
