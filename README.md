# Bank HTML to CSV Bookmarklet

A JavaScript bookmarklet that extracts transaction data from bank statement pages and converts it to CSV format.

## Files in this Project

- `bookmarklet.js` - The fully commented, unminified JavaScript code
- `bookmarklet_ready.js` - The minified JavaScript code ready for use as a bookmarklet
- `bookmarklet.html` - HTML page with drag-and-drop installation for the bookmarklet
- `project_context.md` - Documentation of project requirements and specifications
- `data.html` - Sample of the bank's HTML structure (used for development)

## Installation Instructions

1. Open `bookmarklet.html` in your web browser
2. Drag the blue "Bank HTML to CSV" button to your browser's bookmarks bar
3. Navigate to your bank's transaction page
4. Click the bookmarklet to extract transactions and download as CSV

If your bookmarks bar is hidden:
- Chrome/Edge: Press `Ctrl+Shift+B` (Windows) or `Command+Shift+B` (Mac)
- Firefox: Right-click on the toolbar and select "Bookmarks Toolbar"
- Safari: Select View > Show Favorites Bar

## Features

- Extracts transactions from the bank's HTML page
- Ignores "Scheduled Transactions" table
- Marks transactions from "Pending Transactions" table with "Pending" category
- Transforms descriptions and assigns categories based on keywords
- Inverts transaction amounts (expenses become positive, deposits become negative)
- Downloads data as a CSV file

## CSV Format

The CSV has the following columns:
1. **Description** - Transformed from the original description
2. **Account** - Always "Sofi"
3. **Date** - In M/D/YYYY format
4. **Category** - Based on description keywords or "Pending" for pending transactions
5. **Amount** - Inverted from original (negative becomes positive, positive becomes negative)

## Customization

To customize the description and category mappings:

1. Edit the `descriptionKeywords` and `categoryKeywords` objects in `bookmarklet.js`
2. Add new mappings as needed
3. Regenerate the minified bookmarklet code
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

## Troubleshooting

If the bookmarklet doesn't work:

- Make sure you're on your bank's transaction page
- Check the browser console (F12) for any error messages
- Some banks use security measures that might block bookmarklets
- The HTML structure of the bank's page might have changed, requiring updates to the selectors

## License

This project is created for personal use.
