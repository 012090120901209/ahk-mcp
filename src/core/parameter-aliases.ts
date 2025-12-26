import logger from '../logger.js';

/**
 * Resolves the content parameter with backward compatibility.
 * Priority: newContent > content
 *
 * @param args Tool arguments that may contain content or newContent
 * @returns The resolved content value, or undefined if neither provided
 */
export function resolveContentParameter(args: any): string | undefined {
  // Priority 1: Check for new parameter name
  if (args.newContent !== undefined) {
    // If both provided, warn the user
    if (args.content !== undefined) {
      logger.warn('Both "content" and "newContent" provided. Using "newContent" (recommended).');
    }
    return args.newContent;
  }

  // Priority 2: Check for deprecated parameter name
  if (args.content !== undefined) {
    logger.warn('Parameter "content" is deprecated. Please use "newContent" instead.');
    return args.content;
  }

  // Neither provided
  return undefined;
}

/**
 * Adds deprecation warnings to the result output
 *
 * @param result The MCP tool result object
 * @param usedDeprecated Array of deprecated parameter names that were used
 * @returns Modified result with deprecation warnings prepended
 */
export function addDeprecationWarning(result: any, usedDeprecated: string[]): any {
  if (usedDeprecated.length === 0) {
    return result;
  }

  const warning =
    `⚠️ **Deprecated parameter(s)**: ${usedDeprecated.join(', ')}\n` +
    `Please update to new parameter names. See tool documentation for details.\n\n`;

  // Prepend warning to first text content
  if (result.content && Array.isArray(result.content) && result.content.length > 0) {
    if (result.content[0].type === 'text' && typeof result.content[0].text === 'string') {
      result.content[0].text = warning + result.content[0].text;
    }
  }

  return result;
}

/**
 * Detects which deprecated parameters were used
 *
 * @param args Tool arguments
 * @returns Array of deprecated parameter names that were provided
 */
export function detectDeprecatedParameters(args: any): string[] {
  const deprecated: string[] = [];

  if (args.content !== undefined && args.newContent === undefined) {
    deprecated.push('"content" (use "newContent")');
  }

  return deprecated;
}

/**
 * Helper to get the actual content value and track deprecation
 *
 * @param args Tool arguments
 * @returns Object with content value and list of deprecated params used
 */
export function resolveWithTracking(args: any): {
  content: string | undefined;
  deprecatedUsed: string[];
} {
  const content = resolveContentParameter(args);
  const deprecatedUsed = detectDeprecatedParameters(args);

  return { content, deprecatedUsed };
}
