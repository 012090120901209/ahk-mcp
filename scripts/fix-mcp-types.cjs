#!/usr/bin/env node

/**
 * Batch Fix Script: Remove isError flags and add MCP types
 *
 * This script automatically updates tool files to use the new MCP-compliant type system:
 * 1. Adds MCP type imports if missing
 * 2. Replaces Promise<any> with Promise<McpToolResponse>
 * 3. Removes isError: true flags from error responses
 * 4. Uses createErrorResponse() helper for errors
 */

const fs = require('fs');
const path = require('path');

const TOOLS_DIR = path.join(__dirname, '../src/tools');

const FILES_TO_FIX = [
  'ahk-library-import.ts',
  'ahk-library-info.ts',
  'ahk-library-list.ts',
  'ahk-test-interactive.ts',
  'ahk-system-settings.ts',
  'ahk-system-analytics.ts',
  'ahk-file-active.ts',
  'ahk-active-file.ts',
  'ahk-analyze-vscode.ts',
  'ahk-run-script.ts',
  'ahk-docs-search.ts',
  'ahk-run-debug.ts',
  'ahk-analyze-diagnostics.ts',
  'ahk-memory-context.ts'
];

const MCP_IMPORT = `import { McpToolResponse, createTextResponse, createErrorResponse } from '../types/mcp-types.js';`;

function fixFile(filePath) {
  console.log(`\n📝 Processing: ${path.basename(filePath)}`);

  let content = fs.readFileSync(filePath, 'utf-8');
  let changes = [];

  // 1. Add MCP import if not present
  if (!content.includes("from '../types/mcp-types.js'")) {
    // Find the last import statement
    const importLines = content.split('\n');
    let lastImportIndex = -1;

    for (let i = 0; i < importLines.length; i++) {
      if (importLines[i].startsWith('import ')) {
        lastImportIndex = i;
      }
    }

    if (lastImportIndex !== -1) {
      importLines.splice(lastImportIndex + 1, 0, MCP_IMPORT);
      content = importLines.join('\n');
      changes.push('Added MCP type imports');
    }
  }

  // 2. Replace Promise<any> with Promise<McpToolResponse> in execute methods
  const promiseAnyRegex = /execute\([^)]*\):\s*Promise<any>/g;
  if (promiseAnyRegex.test(content)) {
    content = content.replace(promiseAnyRegex, (match) => {
      return match.replace('Promise<any>', 'Promise<McpToolResponse>');
    });
    changes.push('Updated execute() return type to Promise<McpToolResponse>');
  }

  // 3. Remove isError: true from error responses
  // Pattern: return { content: [...], isError: true };
  const isErrorPattern = /return\s*\{[\s\S]*?content:\s*\[[\s\S]*?\][\s\S]*?,\s*isError:\s*true\s*\}/g;

  let match;
  let replacements = 0;

  // We need to be more careful here - let's just remove the isError property
  content = content.replace(/,\s*isError:\s*true/g, () => {
    replacements++;
    return '';
  });

  if (replacements > 0) {
    changes.push(`Removed ${replacements} isError flag(s)`);
  }

  // 4. Look for simple error patterns and suggest using createErrorResponse
  // This is more complex, so we'll log suggestions rather than auto-fix
  const errorResponsePattern = /return\s*\{\s*content:\s*\[\s*\{\s*type:\s*['"]text['"]\s*,\s*text:\s*[`'"].*?Error.*?[`'"]\s*\}\s*\]\s*\}/g;
  const errorResponses = content.match(errorResponsePattern);

  if (errorResponses && errorResponses.length > 0) {
    console.log(`   ⚠️  Found ${errorResponses.length} error response(s) that could use createErrorResponse()`);
  }

  // Write the file back
  if (changes.length > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`   ✅ Changes made:`);
    changes.forEach(change => console.log(`      - ${change}`));
    return true;
  } else {
    console.log(`   ℹ️  No changes needed`);
    return false;
  }
}

function main() {
  console.log('🚀 Starting MCP Type Migration\n');
  console.log(`📂 Tools directory: ${TOOLS_DIR}`);
  console.log(`📋 Files to process: ${FILES_TO_FIX.length}\n`);

  let fixedCount = 0;
  let skippedCount = 0;

  FILES_TO_FIX.forEach(filename => {
    const filePath = path.join(TOOLS_DIR, filename);

    if (!fs.existsSync(filePath)) {
      console.log(`\n⚠️  File not found: ${filename}`);
      skippedCount++;
      return;
    }

    const wasFixed = fixFile(filePath);
    if (wasFixed) {
      fixedCount++;
    } else {
      skippedCount++;
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log(`   ✅ Fixed: ${fixedCount} files`);
  console.log(`   ℹ️  Skipped: ${skippedCount} files`);
  console.log('='.repeat(60));
  console.log('\n💡 Next steps:');
  console.log('   1. Review the changes with: git diff');
  console.log('   2. Run: npm run build');
  console.log('   3. Fix any remaining type errors manually');
  console.log('   4. Consider using createErrorResponse() for error handling\n');
}

main();
