/**
 * @file transformation.js
 * @description Functions for transforming raw transaction data into the required format
 */

/**
 * Transforms raw transaction data into the required CSV format
 * @param {Array.<Object>} transactions - Raw transaction data
 * @returns {Array.<Object>} - Transformed transaction data
 */
function transformTransactions(transactions) {
  const transformedData = [];
  
  // Process each transaction
  transactions.forEach(transaction => {
    // Column 1: Transform Description
    const transformedDescription = transformDescription(transaction.description);
    
    // Column 2: Account (always "Sofi")
    const account = "Sofi";
    
    // Column 3: Format Date (M/D/YYYY)
    const formattedDate = formatDate(transaction.date);
    
    // Column 4: Determine Category
    let category = "";
    if (transaction.isPending) {
      category = "Pending"; // Special case for Pending transactions
    } else {
      category = determineCategory(transaction.description);
    }
    
    // Column 5: Transform Amount (invert sign)
    const transformedAmount = transformAmount(transaction.amount);
    
    // Add transformed transaction to array
    transformedData.push({
      description: transformedDescription,
      account: account,
      date: formattedDate,
      category: category,
      amount: transformedAmount
    });
  });
  
  // Reverse order of transactions as per requirement
  return transformedData.reverse();
}
