const fs = require('fs');
const path = require('path');

function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Replace '../ui/' with '../components/ui/'
    if (content.includes('../ui/')) {
      content = content.replace(/from '\.\.\/ui\//g, "from '../components/ui/");
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDirectory(filePath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      fixImportsInFile(filePath);
    }
  }
}

// Start from src directory
console.log('Starting import fix...');
walkDirectory('./src');
console.log('Import fix completed!');

