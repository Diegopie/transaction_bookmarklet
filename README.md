# Bank HTML to CSV Bookmarklet

A JavaScript bookmarklet that extracts transaction data from bank statement pages and converts it to CSV format with customizable mappings for descriptions and categories.

## Project Overview

This project provides a modular, maintainable system for building a bank transaction extraction bookmarklet. It includes:

- A structured, component-based code organization
- Full JSDoc documentation
- An automated build system
- Customizable transaction categorization and description mapping

## Directory Structure

```
bank-transaction-bookmarklet/
├── src/                  # Source code directory
│   ├── bookmarklet.js    # Main entry point
│   ├── components/       # Component modules
│   │   ├── csv.js        # CSV generation functionality
│   │   ├── extraction.js # HTML extraction functionality
│   │   └── transformation.js # Data transformation
│   └── utils/            # Utility modules
│       ├── formatter.js  # Data formatting utilities
│       └── mappings.js   # Description and category mappings
├── build/                # Build output directory
│   ├── bookmarklet.min.js # Minified JavaScript
│   ├── bookmarklet.txt   # Bookmarklet code for direct use
│   ├── build.js          # Build script
│   └── template.html     # HTML template for bookmarklet page
├── bookmarklet.html      # Generated HTML for installation
├── package.json          # Project dependencies
└── README.md             # This documentation file
```

## Installation Instructions

### For End Users

1. Open `bookmarklet.html` in your web browser
2. Drag the blue "Bank HTML to CSV" button to your browser's bookmarks bar
3. Navigate to your bank's transaction page
4. Click the bookmarklet to extract transactions and download as CSV

If your bookmarks bar is hidden:
- Chrome/Edge: Press `Ctrl+Shift+B` (Windows) or `Command+Shift+B` (Mac)
- Firefox: Right-click on the toolbar and select "Bookmarks Toolbar"
- Safari: Select View > Show Favorites Bar

### For Developers

1. Clone the repository
2. Install dependencies: `npm install`
3. Make changes to files in the `src` directory
4. Run the build script: `npm run build` or `node build/build.js`
5. Open `bookmarklet.html` to test your changes

## Features

- Extracts transactions from the bank's HTML page
- Ignores "Scheduled Transactions" table
- Marks transactions from "Pending Transactions" table with "Pending" category
- Transforms descriptions and assigns categories based on keywords
- Inverts transaction amounts (expenses become positive, deposits become negative)
- Downloads data as a CSV file
- Modular code structure for easy maintenance
- Full JSDoc documentation
- Automated build system

## CSV Format

The CSV has the following columns:
1. **Description** - Transformed from the original description
2. **Account** - Always "Sofi"
3. **Date** - In M/D/YYYY format
4. **Category** - Based on description keywords or "Pending" for pending transactions
5. **Amount** - Inverted from original (negative becomes positive, positive becomes negative)

## Code Organization

The project is organized into modular components:

### Main File
- `src/bookmarklet.js`: Entry point that imports all other modules

### Components
- `src/components/extraction.js`: Functions to extract transaction data from HTML
- `src/components/transformation.js`: Functions to transform raw data into required format
- `src/components/csv.js`: Functions to generate and download CSV data

### Utilities
- `src/utils/mappings.js`: Keyword mappings for descriptions and categories
- `src/utils/formatter.js`: Formatting functions for dates, amounts, and descriptions

## Customization

To customize the description and category mappings:

1. Edit the `descriptionKeywords` and `categoryKeywords` objects in `src/utils/mappings.js`
2. Add new mappings as needed
3. Run the build script: `npm run build`
4. Update the bookmarklet in your browser

### Description Keywords

These map keywords in the original bank description to cleaner descriptions:

```javascript
const descriptionKeywords = {
  "Roundup": "Roundup",
  "AMAZON": "Amazon",
  "AMZN": "Amazon",
  // Add more as needed
};
```

### Category Keywords

These map keywords in the description to predefined categories:

```javascript
const categoryKeywords = {
  "COSTCO": "Groceries",
  "WALMART": "Groceries",
  "AMAZON": "Shopping",
  // Add more as needed
};
```

### Allowed Categories

The following categories are allowed:
- Income
- Other
- Bills
- Debt
- Business
- Freelance
- Membership
- Subscription
- Snacks
- Coffee
- Food
- Entertainment
- Groceries
- Transportation
- Misc
- Transfer
- Savings
- Pending

## Build System

The project includes an automated build system that handles:

1. **Code Combination**: Imports all modules into a single file
2. **Minification**: Reduces file size by removing whitespace and shortening variable names
3. **Bookmarklet Formatting**: Encodes the code for use as a browser bookmark
4. **HTML Generation**: Creates an installation page with the bookmarklet

### Build Process

When you run `npm run build` or `node build/build.js`:

1. The build script reads the main file (`src/bookmarklet.js`)
2. It processes `@import` statements to include other modules
3. It minifies the combined code using UglifyJS
4. It generates:
   - `build/bookmarklet.min.js`: Minified JavaScript code
   - `build/bookmarklet.txt`: Bookmarklet-formatted code
   - `bookmarklet.html`: HTML page for installation

### Customizing the Build

You can modify:
- `build/template.html`: The HTML template for the installation page
- `build/build.js`: The build script itself to add more features

## Development Guide

### JSDoc Documentation

The project uses JSDoc comments to provide documentation and type information:

```javascript
/**
 * Extracts data from a single table row
 * @param {HTMLElement} row - Table row DOM element
 * @param {boolean} isPendingTable - Whether this row is from the Pending table
 * @returns {Object|null} - Transaction object or null if extraction failed
 */
function extractRowData(row, isPendingTable) {
  // Function implementation
}
```

When adding or modifying code, please maintain the JSDoc documentation to keep the code readable and maintainable.

### Adding a New Feature

1. Identify which component should contain the feature
2. Add the necessary code to the appropriate file with JSDoc comments
3. If needed, add new utility functions to formatter.js
4. Run the build script to update the bookmarklet

### Modifying HTML Parsing

If the bank's HTML structure changes:

1. Update the selectors in `src/components/extraction.js`
2. Adjust the extraction logic as needed
3. Test with sample HTML data
4. Rebuild the bookmarklet

## Troubleshooting

If the bookmarklet doesn't work:

- Make sure you're on your bank's transaction page
- Check the browser console (F12) for any error messages
- Some banks use security measures that might block bookmarklets
- The HTML structure of the bank's page might have changed, requiring updates to the selectors
- Ensure your browser supports bookmarklets (most do)

## License

This project is created for personal use.

## Contributing

This is a personal project, but suggestions for improvements are welcome.
