# Bank HTML to CSV Bookmarklet Project

## Project Overview
This project involves creating a JavaScript bookmarklet to parse transaction data from a bank's online statement page and generate a CSV file with specific formatting requirements.

## HTML Structure
The bank website displays transactions in several tables:
- **Scheduled Transactions** - to be ignored
- **Pending Transactions** - to be included with special "Pending" category
- **Monthly Transaction Tables** - organized by month (June, May, etc.)

### Table Structure
Each transaction table has the following columns:
- Date (col0)
- Description (col1)
- Type (col2)
- Empty column (col3)
- Amount (col4)
- Balance (col5) - not in all tables
- Expand button (col6)

### Transaction Example
```html
<tr data-mjs-value="index=0|expanded=false" class="sc-la-DkbX kCTwtJ">
  <td role="cell" class="col0 firstDate"><span class="">Jun 3</span></td>
  <td role="cell" class="col1 sr-mask"><span>LA PUENTE </span></td>
  <td role="cell" class="col2"><span>Debit Card</span></td>
  <td role="cell" class="col3"></td>
  <td role="cell" class="col4"><span class="sc-iUwfNp kbsNxk">-$24.43</span></td>
  <td role="cell" class="col5"><span>$1,307.25</span></td>
  <td role="cell" class="col6"><!-- button content --></td>
</tr>
```

## CSV Output Requirements
The CSV should have 5 columns in the following order:
1. **Description** (transformed from HTML description)
2. **Account** (always "Sofi")
3. **Date** (M/D/YYYY format)
4. **Category** (derived from keywords in description)
5. **Amount** (transformed from HTML amount)

### Transformations
- **Description:** Use keyword mapping to transform descriptions.
- **Category:** Use keyword mapping to assign categories from a predefined list.
- **Amount:** Invert sign (negative becomes positive, positive becomes negative).
- **Order:** Transactions should be in inverted order from HTML.

### Special Rules
- Transactions from "Pending Transactions" table should have category "Pending"
- Ignore "Scheduled Transactions" table.

## Keyword Mapping Systems
Two mapping systems are needed:
1. `descriptionKeywords` - Maps keywords in original descriptions to cleaner descriptions
2. `categoryKeywords` - Maps keywords in descriptions to predefined categories

### Allowed Categories
Income, Other, Bills, Debt, Business, Freelance, Membership, Subscription, Snacks, Coffee, Food, Entertainment, Groceries, Transportation, Misc, Transfer, Savings, Pending

## Technical Requirements
- Plain JavaScript (ES6+)
- No external libraries
- Download CSV file or display in modal for copying
- Well-commented code
