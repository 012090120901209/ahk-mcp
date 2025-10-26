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
export function createErrorResponse(message: string, details?: any): ToolResponse {
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
export function createSuccessResponse(message: string, data?: any): ToolResponse {
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
