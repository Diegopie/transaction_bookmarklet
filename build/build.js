const fs = require('fs');
const path = require('path');
const UglifyJS = require('uglify-js');

// Paths
const SRC_DIR = path.join(__dirname, '..', 'src');
const MAIN_FILE = path.join(SRC_DIR, 'bookmarklet.js');
const OUTPUT_FILE = path.join(__dirname, '..', 'build', 'bookmarklet.min.js');
const BOOKMARKLET_FILE = path.join(__dirname, '..', 'build', 'bookmarklet.txt');
const HTML_TEMPLATE = path.join(__dirname, 'template.html');
const HTML_OUTPUT = path.join(__dirname, '..', 'bookmarklet.html');

// Read the main bookmarklet file
console.log('Reading source file...');
let code = fs.readFileSync(MAIN_FILE, 'utf8');

// Process imports
console.log('Processing imports...');
const importRegex = /\/\/ @import\s+['"](.+)['"]/g;
let match;

while ((match = importRegex.exec(code)) !== null) {
  const importPath = match[1];
  const fullPath = path.join(SRC_DIR, importPath);
  
  console.log(`Importing ${importPath}...`);
  
  if (fs.existsSync(fullPath)) {
    const importedCode = fs.readFileSync(fullPath, 'utf8');
    code = code.replace(match[0], importedCode);
  } else {
    console.error(`Error: Import file not found: ${fullPath}`);
    process.exit(1);
  }
}

// Minify the code
console.log('Minifying code...');
const minified = UglifyJS.minify(code);

if (minified.error) {
  console.error('Error during minification:', minified.error);
  process.exit(1);
}

// Create the bookmarklet format (javascript:... format)
console.log('Creating bookmarklet...');
const bookmarklet = `javascript:${encodeURIComponent(minified.code)}`;

// Write the minified JS
fs.writeFileSync(OUTPUT_FILE, minified.code);
console.log(`Minified JavaScript written to ${OUTPUT_FILE}`);

// Write the bookmarklet
fs.writeFileSync(BOOKMARKLET_FILE, bookmarklet);
console.log(`Bookmarklet code written to ${BOOKMARKLET_FILE}`);

// If HTML template exists, create the HTML file with the bookmarklet
if (fs.existsSync(HTML_TEMPLATE)) {
  console.log('Creating HTML file...');
  let htmlTemplate = fs.readFileSync(HTML_TEMPLATE, 'utf8');
  const htmlOutput = htmlTemplate.replace('{{BOOKMARKLET}}', bookmarklet);
  fs.writeFileSync(HTML_OUTPUT, htmlOutput);
  console.log(`HTML file written to ${HTML_OUTPUT}`);
}

console.log('Build completed successfully!');
