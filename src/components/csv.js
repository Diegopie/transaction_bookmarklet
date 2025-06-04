/**
 * @file csv.js
 * @description Functions for generating and downloading CSV data
 */

/**
 * Generates CSV from transformed transaction data and initiates download
 * @param {Array.<Object>} data - Transformed transaction data
 */
function generateCSV(data) {
  if (data.length === 0) {
    alert("No transactions found to export!");
    return;
  }
  
  // Define CSV headers
  const headers = ["Description", "Account", "Date", "Category", "Amount"];
  
  // Start building CSV content with headers
  let csvContent = headers.join(",") + "\n";
  
  // Add data rows
  data.forEach(row => {
    // Properly escape fields that might contain commas
    const escapedDescription = escapeCSVField(row.description);
    const escapedAccount = escapeCSVField(row.account);
    const escapedDate = escapeCSVField(row.date);
    const escapedCategory = escapeCSVField(row.category);
    
    // Amount doesn't need escaping as it's just a number
    
    // Add the row to CSV content
    csvContent += `${escapedDescription},${escapedAccount},${escapedDate},${escapedCategory},${row.amount}\n`;
  });
  
  // Trigger download
  downloadCSV(csvContent);
}

/**
 * Creates and triggers download of CSV file
 * @param {string} csvContent - CSV content as string
 */
function downloadCSV(csvContent) {
  // Create a blob with the CSV data
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a download link
  const link = document.createElement('a');
  
  // Support for browsers with URL API
  if (window.URL && window.URL.createObjectURL) {
    link.href = window.URL.createObjectURL(blob);
    link.download = "transactions.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    // Fallback for older browsers
    // Create a modal dialog with the CSV content for copying
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    modal.style.zIndex = '9999';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#fff';
    modalContent.style.padding = '20px';
    modalContent.style.borderRadius = '5px';
    modalContent.style.maxWidth = '80%';
    modalContent.style.maxHeight = '80%';
    modalContent.style.overflowY = 'auto';
    
    const heading = document.createElement('h3');
    heading.textContent = 'Copy the CSV data below:';
    
    const textarea = document.createElement('textarea');
    textarea.value = csvContent;
    textarea.style.width = '100%';
    textarea.style.height = '200px';
    textarea.style.marginTop = '10px';
    
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.marginTop = '10px';
    closeButton.style.padding = '5px 15px';
    closeButton.onclick = function() {
      document.body.removeChild(modal);
    };
    
    modalContent.appendChild(heading);
    modalContent.appendChild(textarea);
    modalContent.appendChild(closeButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Select all text for easy copying
    textarea.select();
  }
}
