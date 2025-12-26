module.exports = {
  // TypeScript source files
  // Note: ESLint is intentionally not run in pre-commit via lint-staged.
  // In this repo it can be slow/unstable on Windows (SIGKILL) and there are
  // existing lint findings that are better handled in CI or dedicated lint runs.
  'src/**/*.{ts,tsx}': ['prettier --check'],

  // TypeScript scripts
  'scripts/**/*.{ts,tsx}': ['prettier --check'],

  // Tests/manual and other TS under Tests often contains quick snippets; keep formatting
  // consistent but don't block commits on lint rules.
  'Tests/**/*.{ts,tsx}': ['prettier --check'],

  // Root JS config shims (repo is type=module)
  '.lintstagedrc.js': ['prettier --check'],
  '.prettierrc.js': ['prettier --check'],

  // JavaScript files (limit scope; avoid dist/ built output)
  'scripts/**/*.{js,jsx,mjs}': ['prettier --check'],
  'Tests/**/*.{js,jsx,mjs}': ['prettier --check'],

  // JSON files
  '*.{json,jsonc}': ['prettier --check'],

  // Markdown files
  '*.md': ['prettier --check'],

  // YAML files
  '*.{yml,yaml}': ['prettier --check'],

  // AutoHotkey files
  '*.ahk': ['echo "AutoHotkey file(s) staged"'],

  // Package.json - special handling
  'package.json': ['prettier --check'],
};
