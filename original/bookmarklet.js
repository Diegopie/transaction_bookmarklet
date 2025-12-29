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
    "BEANS & BREWS": "Bean",
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
    "BEANS & BREWS": "Coffee",
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
    
    // New structure: h4 headings followed by role="list" divs
    const headings = document.querySelectorAll('h4[id^="activity-list-group-title-"]');
    
    // Iterate through each heading
    headings.forEach(heading => {
      const headingText = heading.textContent.trim();
      
      // Skip "Scheduled" transactions as per requirements
      if (headingText === "Scheduled") return;
      
      // Check if this is the "Pending" group
      const isPendingGroup = headingText === "Pending";
      
      // Extract the date from the heading if it's a date group
      let groupDate = null;
      if (!isPendingGroup && headingText !== "Scheduled") {
        groupDate = headingText;
      }
      
      // Find the associated role="list" div
      const listDiv = heading.parentElement.querySelector('div[role="list"]');
      if (!listDiv) return;
      
      // Process all list items in the list
      const items = listDiv.querySelectorAll('div[role="listitem"]');
      items.forEach(item => {
        const transaction = extractItemData(item, isPendingGroup, groupDate);
        if (transaction) {
          transactions.push(transaction);
        }
      });
    });
    
    return transactions;
  }
  
  // Extract data from a single list item
  function extractItemData(item, isPendingGroup, groupDate) {
    try {
      // The transaction details are in the button element
      const button = item.querySelector('button');
      if (!button) return null;
      
      let description = "";
      let dateText = "";
      let amountText = "";
      
      // New structure has two main divs in the button span:
      // 1. First div (with class containing x1iyjqo2): description and account info
      // 2. Second div (with class containing xpqajaz): amount and date
      
      const spanWrapper = button.querySelector('span.x6s0dn4');
      if (!spanWrapper) return null;
      
      const divs = spanWrapper.querySelectorAll(':scope > div');
      
      if (divs.length >= 2) {
        // First div: contains description and account info
        const firstDiv = divs[0];
        const firstDivSpans = firstDiv.querySelectorAll('span');
        if (firstDivSpans.length > 0) {
          description = firstDivSpans[0].textContent.trim();
        }
        
        // Second div: contains amount and date
        const secondDiv = divs[1];
        const secondDivSpans = secondDiv.querySelectorAll('span');
        
        // IMPORTANT: The order in the second div is:
        // First span: transaction amount (e.g., "-$120.00")
        // Second span: date (e.g., "January 6, 2026")
        if (secondDivSpans.length >= 2) {
          // Get amount from first span
          const firstSpanText = secondDivSpans[0].textContent.trim();
          if (/\$/.test(firstSpanText)) {
            amountText = firstSpanText;
          }
          
          // Get date from second span
          const secondSpanText = secondDivSpans[1].textContent.trim();
          if (/\d{4}/.test(secondSpanText) || /[A-Z][a-z]+/.test(secondSpanText)) {
            dateText = secondSpanText;
          }
        }
      }
      
      // If we still don't have required data, return null
      if (!description && !amountText) {
        return null;
      }
      
      // Use groupDate as fallback only if we don't have a dateText
      if (!dateText) {
        dateText = groupDate || "";
      }
      
      return {
        date: dateText,
        description: description,
        amount: amountText,
        isPending: isPendingGroup
      };
    } catch (error) {
      console.error("Error extracting item data:", error);
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
    
    // Format: "November 22, 2025" -> "11/22/2025"
    if (/^[A-Za-z]+\s+\d{1,2},\s+\d{4}$/.test(dateString)) {
      const parts = dateString.split(' ');
      const monthName = parts[0];
      const day = parts[1].replace(',', '');
      const year = parts[2];
      
      // Convert month name to month number
      const monthNames = ["January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"];
      const monthIndex = monthNames.findIndex(m => monthName.startsWith(m));
      
      if (monthIndex !== -1) {
        return `${monthIndex + 1}/${day}/${year}`;
      }
    }
    
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
