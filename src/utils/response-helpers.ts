/**
 * Response helper utilities for consistent MCP tool response formatting
 */

export interface ToolResponse {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/**
 * Create a standardized error response
 * @param message Error message to display
 * @param details Optional additional details or data
 * @returns Standardized MCP error response
 */
export function createErrorResponse(message: string, details?: unknown): ToolResponse {
  const content: Array<{ type: 'text'; text: string }> = [
    { type: 'text', text: `Error: ${message}` }
  ];

  if (details) {
    content.push({
      type: 'text',
      text: typeof details === 'string' ? details : JSON.stringify(details, null, 2)
    });
  }

  return {
    content,
    isError: true
  };
}

/**
 * Create a standardized success response
 * @param message Success message to display
 * @param data Optional additional data to include
 * @returns Standardized MCP success response
 */
export function createSuccessResponse(message: string, data?: unknown): ToolResponse {
  const content: Array<{ type: 'text'; text: string }> = [
    { type: 'text', text: message }
  ];

  if (data) {
    content.push({
      type: 'text',
      text: typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    });
  }

  return {
    content
  };
}

/**
 * Create a multi-part response with mixed content
 * @param parts Array of text parts to include
 * @param isError Whether this is an error response
 * @returns Standardized MCP response
 */
export function createMultiPartResponse(
  parts: string[],
  isError: boolean = false
): ToolResponse {
  return {
    content: parts.map(part => ({ type: 'text', text: part })),
    ...(isError && { isError: true })
  };
}

/**
 * Fluent response builder for complex tool responses
 *
 * Usage:
 *   return ResponseBuilder.success('Operation complete')
 *     .withData({ files: 3 })
 *     .withDetails('Additional info')
 *     .build();
 *
 *   return ResponseBuilder.error('File not found')
 *     .withDetails(error.message)
 *     .build();
 */
export class ResponseBuilder {
  private parts: string[] = [];
  private isError: boolean = false;

  private constructor() {}

  /**
   * Start building a success response
   */
  static success(message: string): ResponseBuilder {
    const builder = new ResponseBuilder();
    builder.parts.push(message);
    return builder;
  }

  /**
   * Start building an error response
   */
  static error(message: string): ResponseBuilder {
    const builder = new ResponseBuilder();
    builder.parts.push(`Error: ${message}`);
    builder.isError = true;
    return builder;
  }

  /**
   * Start building a response with a title/header
   */
  static titled(title: string): ResponseBuilder {
    const builder = new ResponseBuilder();
    builder.parts.push(`**${title}**`);
    return builder;
  }

  /**
   * Add structured data as JSON
   */
  withData(data: unknown): ResponseBuilder {
    this.parts.push(JSON.stringify(data, null, 2));
    return this;
  }

  /**
   * Add plain text details
   */
  withDetails(details: string): ResponseBuilder {
    this.parts.push(details);
    return this;
  }

  /**
   * Add a section with a label
   */
  withSection(label: string, content: string | unknown): ResponseBuilder {
    const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    this.parts.push(`**${label}:**\n${text}`);
    return this;
  }

  /**
   * Add code block
   */
  withCode(code: string, language: string = 'autohotkey'): ResponseBuilder {
    this.parts.push(`\`\`\`${language}\n${code}\n\`\`\``);
    return this;
  }

  /**
   * Add a list of items
   */
  withList(items: string[], ordered: boolean = false): ResponseBuilder {
    const list = items.map((item, i) => ordered ? `${i + 1}. ${item}` : `• ${item}`).join('\n');
    this.parts.push(list);
    return this;
  }

  /**
   * Build the final response
   */
  build(): ToolResponse {
    return {
      content: this.parts.map(part => ({ type: 'text' as const, text: part })),
      ...(this.isError && { isError: true })
    };
  }

  /**
   * Build as a single combined text block
   */
  buildCombined(separator: string = '\n\n'): ToolResponse {
    return {
      content: [{ type: 'text' as const, text: this.parts.join(separator) }],
      ...(this.isError && { isError: true })
    };
  }
}
