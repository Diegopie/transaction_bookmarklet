/**
 * @file bookmarklet.js
 * @description Main bookmarklet file that imports and orchestrates all components
 * @version 1.0.0
 * @author Your Name
 */

(function() {
  /**
   * Bank HTML to CSV Bookmarklet
   * A tool to extract transaction data from bank HTML and generate a CSV file.
   */
  
  // Import mappings
  // @import 'utils/mappings.js'
  
  // Import formatters
  // @import 'utils/formatter.js'
  
  // Import extraction functions
  // @import 'components/extraction.js'
  
  // Import transformation functions
  // @import 'components/transformation.js'
  
  // Import CSV generation functions
  // @import 'components/csv.js'
  
  /**
   * Main function to process transactions
   * This is the entry point for the bookmarklet
   */
  function processTransactions() {
    console.log("Bank HTML to CSV Bookmarklet activated");
    
    // Extract transactions data from the page
    const transactions = extractTransactions();
    
    // Transform and format the transactions data
    const transformedData = transformTransactions(transactions);
    
    // Generate and download CSV
    generateCSV(transformedData);
  }

  // Start the process
  processTransactions();
})();
