module.exports = {
  // TypeScript files
  '*.{ts,tsx}': [
    // Check formatting first
    'prettier --check',
    // Run ESLint
    'eslint --fix --max-warnings=0',
    // Run TypeScript compiler for type checking
    'tsc --noEmit'
  ],
  
  // JavaScript files
  '*.{js,jsx,mjs}': [
    'prettier --check',
    'eslint --fix --max-warnings=0'
  ],
  
  // JSON files
  '*.{json,jsonc}': [
    'prettier --check'
  ],
  
  // Markdown files
  '*.md': [
    'prettier --check'
  ],
  
  // YAML files
  '*.{yml,yaml}': [
    'prettier --check'
  ],
  
  // AutoHotkey files
  '*.ahk': [
    // Add AHK-specific linting if available
    'echo "AutoHotkey file staged: ${filepath}"'
  ],
  
  // Package.json - special handling
  'package.json': [
    'prettier --check',
    // Validate package.json structure
    'npm ls --depth=0 || true'
  ],
  
  // TypeScript configuration files
  '*.{tsconfig,jsconfig}.json': [
    'prettier --check',
    // Validate TypeScript configuration
    'tsc --project . --noEmit --skipLibCheck || true'
  ]
};