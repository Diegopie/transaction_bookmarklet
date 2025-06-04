// Bank HTML to CSV Bookmarklet
(function() {
  // =================================================================
  // Description Keyword Mappings
  // Maps keywords found in original descriptions to cleaner descriptions
  // =================================================================
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
    "TACOS LOS ANGELES": "Tacos Los Angeles"
    // Add more mappings as needed
  };

  // =================================================================
  // Category Keyword Mappings
  // Maps keywords found in descriptions to specific categories
  // =================================================================
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
    "SLCC": "Education"
    // Add more mappings as needed
  };

  // =================================================================
  // Allowed Categories
  // =================================================================
  const allowedCategories = [
    "Income", "Other", "Bills", "Debt", "Business", "Freelance", 
    "Membership", "Subscription", "Snacks", "Coffee", "Food", 
    "Entertainment", "Groceries", "Transportation", "Misc", 
    "Transfer", "Savings", "Pending"
  ];

  // =================================================================
  // Main Function
  // =================================================================
  function processTransactions() {
    console.log("Bank HTML to CSV Bookmarklet activated");
    
    // Extract transactions data from the page
    const transactions = extractTransactions();
    
    // Transform and format the transactions data
    const transformedData = transformTransactions(transactions);
    
    // Generate and download CSV
    generateCSV(transformedData);
  }
  // =================================================================
  // Transaction Extraction
  // =================================================================
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
  
  // Extract data from a single table row
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
  // =================================================================
  // Transaction Transformation
  // =================================================================
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
  
  // Transform description using keyword mapping
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
  
  // Format date to M/D/YYYY
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
  
  // Determine category based on description
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
  
  // Transform amount (invert sign)
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
  // =================================================================
  // CSV Generation and Download
  // =================================================================
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
  
  // Escape special characters for CSV format
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
  
  // Create and trigger download of CSV file
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

  // Start the process
  processTransactions();
})();
