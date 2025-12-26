import { Diagnostic } from '../types/index.js';

export interface FixResult {
  code: string;
  fixes: Array<{
    description: string;
    line: number;
    before: string;
    after: string;
  }>;
}

export class AhkFixService {
  /**
   * Apply fixes to the code based on diagnostics
   */
  applyFixes(code: string, diagnostics: Diagnostic[], fixLevel: string): FixResult {
    const lines = code.split('\n');
    const appliedFixes: Array<{
      description: string;
      line: number;
      before: string;
      after: string;
    }> = [];

    // Sort diagnostics by line number (descending) to avoid offset issues
    const sortedDiagnostics = [...diagnostics].sort(
      (a, b) => b.range.start.line - a.range.start.line
    );

    for (const diagnostic of sortedDiagnostics) {
      const fix = this.generateFix(diagnostic, lines, fixLevel);
      if (fix) {
        const lineIndex = diagnostic.range.start.line;
        const originalLine = lines[lineIndex];
        lines[lineIndex] = fix.newText;

        appliedFixes.push({
          description: fix.description,
          line: lineIndex + 1,
          before: originalLine.trim(),
          after: fix.newText.trim(),
        });
      }
    }

    return {
      code: lines.join('\n'),
      fixes: appliedFixes.reverse(), // Restore original order
    };
  }

  /**
   * Generate a fix for a single diagnostic
   */
  private generateFix(
    diagnostic: Diagnostic,
    lines: string[],
    fixLevel: string
  ): {
    description: string;
    newText: string;
  } | null {
    const line = lines[diagnostic.range.start.line];
    const message = diagnostic.message;

    // Safe fixes (always apply)
    if (fixLevel === 'safe' || fixLevel === 'aggressive') {
      // Fix assignment operator (= → :=)
      if (message.includes('Use ":=" for assignment')) {
        const fixed = line.replace(/(\w+)\s*=\s*([^=])/, '$1 := $2');
        if (fixed !== line) {
          return {
            description: 'Fixed assignment operator (= → :=)',
            newText: fixed,
          };
        }
      }

      // Add #Requires directive
      if (message.includes('#Requires AutoHotkey v2') && diagnostic.range.start.line === 0) {
        return {
          description: 'Added #Requires AutoHotkey v2 directive',
          newText: '#Requires AutoHotkey v2.0\n' + line,
        };
      }

      // Fix command-style to function-style
      if (message.includes('Use function-call syntax')) {
        const match = line.match(/^(\s*)(\w+)\s+(.+)$/);
        if (match) {
          const [, indent, cmd, args] = match;
          return {
            description: `Fixed command style: ${cmd} → ${cmd}()`,
            newText: `${indent}${cmd}(${args})`,
          };
        }
      }
    }

    // Style-only fixes
    if (fixLevel === 'style-only' || fixLevel === 'aggressive') {
      // Fix indentation
      if (message.includes('Expected') && message.includes('spaces')) {
        const expectedMatch = message.match(/Expected (\d+) spaces/);
        if (expectedMatch) {
          const expectedSpaces = parseInt(expectedMatch[1]);
          const trimmed = line.trimStart();
          return {
            description: `Fixed indentation (${expectedSpaces} spaces)`,
            newText: ' '.repeat(expectedSpaces) + trimmed,
          };
        }
      }
    }

    return null;
  }
}
