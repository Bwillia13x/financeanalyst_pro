#!/bin/bash

# FinanceAnalyst Pro - localStorage Migration Script
# Automated script to replace unsafe localStorage calls with safe wrappers

set -e

echo "🔧 FinanceAnalyst Pro - localStorage Migration Script"
echo "=================================================="
echo ""

# Find all files with localStorage usage (excluding already fixed files)
echo "🔍 Scanning for remaining localStorage usage..."

LOCALSTORAGE_FILES=$(find . -name "*.js" -o -name "*.jsx" | grep -v node_modules | grep -v .next | xargs grep -l "localStorage\." | grep -v help-showcase.js | grep -v src/utils/storageUtils.js | head -10)

if [ -z "$LOCALSTORAGE_FILES" ]; then
    echo "✅ No files found with localStorage usage (excluding already processed files)"
    exit 0
fi

echo "📋 Files needing migration:"
echo "$LOCALSTORAGE_FILES"
echo ""

# Count files and operations
FILE_COUNT=$(echo "$LOCALSTORAGE_FILES" | wc -l)
echo "📊 Migration Statistics:"
echo "   Files to process: $FILE_COUNT"

# Show current problematic patterns in these files
echo ""
echo "🔍 Analyzing problematic patterns..."

echo "
Most common localStorage usage patterns found:
1. localStorage.getItem() - Direct access calls
2. localStorage.setItem() - Direct storage calls
3. localStorage.removeItem() - Direct removal calls
4. localStorage.clear() - Direct clear calls

Migration plan:
1. Add import for safe storage utilities
2. Replace getItem() with safeGetItem()
3. Replace setItem() with safeSetItem()
4. Wrap operations with isLocalStorageAvailable() checks
5. Handle errors gracefully
"

echo ""
echo "🛠️ MIGRATION GUIDE:"
echo "===================="
echo ""

echo "1. Import Statement to Add (at top of each file):"
echo "   import { safeGetItem, safeSetItem, safeRemoveItem, isLocalStorageAvailable } from './src/utils/storageUtils.js';"
echo ""

echo "2. Common Replacements:"
echo ""
echo "   BEFORE: localStorage.getItem('key')"
echo "   AFTER:  safeGetItem('key', defaultValue)"
echo ""
echo "   BEFORE: localStorage.setItem('key', value)"
echo "   AFTER:  safeSetItem('key', value)"
echo ""
echo "   BEFORE: localStorage.removeItem('key')"
echo "   AFTER:  safeRemoveItem('key')"
echo ""

echo "3. Example Migration Pattern:"
echo ""
echo ' BEFORE:
  async saveData(data) {
    try {
      localStorage.setItem("mydata", JSON.stringify(data));
    } catch (error) {
      console.error("Save failed:", error);
    }
  }'
echo ""
echo ' AFTER:
  async saveData(data) {
    if (!isLocalStorageAvailable()) {
      console.log("localStorage not available - skipping save");
      return;
    }
    try {
      safeSetItem("mydata", JSON.stringify(data));
    } catch (error) {
      console.error("Save failed:", error);
    }
  }'

echo ""
echo ""
echo "🚀 Automated Migration Commands:"
echo "================================"
echo ""

echo "# 1. Auto-fix the most common patterns:"
echo "find . -name '*.js' -o -name '*.jsx' | grep -v node_modules | xargs sed -i 's/localStorage\.getItem/safeGetItem/g'"
echo "find . -name '*.js' -o -name '*.jsx' | grep -v node_modules | xargs sed -i 's/localStorage\.setItem/safeSetItem/g'"
echo "find . -name '*.js' -o -name '*.jsx' | grep -v node_modules | xargs sed -i 's/localStorage\.removeItem/safeRemoveItem/g'"
echo ""

echo "# 2. Add imports to files needing them:"
echo "find . -name '*.js' -o -name '*.jsx' | grep -v node_modules | xargs grep -l 'safeGetItem\|safeSetItem' | xargs sed -i '1i import { safeGetItem, safeSetItem, safeRemoveItem, isLocalStorageAvailable } from \"./src/utils/storageUtils.js\";'"
echo ""

echo "# 3. Check migration results:"
echo "find . -name '*.js' -o -name '*.jsx' | grep -v node_modules | xargs grep -n 'localStorage\.'"
echo ""

echo ""
echo "✅ MANUAL MIGRATION STEPS:"
echo "=========================="

i=1
echo "$LOCALSTORAGE_FILES" | while read -r file; do
    if [ -f "$file" ]; then
        echo "$i. $file"
        echo "   sed -i '1i import { safeGetItem, safeSetItem, isLocalStorageAvailable } from \"./src/utils/storageUtils.js\";' \"$file\""
        echo "   sed -i 's/localStorage\.getItem/safeGetItem/g; s/localStorage\.setItem/safeSetItem/g; s/localStorage\.removeItem/safeRemoveItem/g' \"$file\""
        echo ""
        i=$((i + 1))
    fi
done

echo ""
echo "🔧 After migration, run tests to verify:"
echo "npm run test"
echo ""
echo "✅ Migration script completed."
echo "Manual intervention recommended for accurate migration."

exit 0