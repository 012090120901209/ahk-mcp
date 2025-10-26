/**
 * Validation middleware for centralized Zod error handling and consistent error responses
 * Provides utilities for validating tool arguments and formatting validation errors
 */

import { z } from 'zod';
import logger from '../logger.js';

/**
 * Represents a formatted validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  received?: unknown;
}

/**
 * Result of validation attempt
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
  rawError?: z.ZodError;
}

/**
 * MCP tool response format
 */
export interface ToolResponse {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/**
 * Format a Zod validation error into a user-friendly error response
 * Extracts field-level issues and includes suggestions
 */
export function formatZodError(error: z.ZodError): ValidationError[] {
  return error.issues.map(issue => {
    // Build field path (nested objects like "filePath" or "path.to.field")
    const field = issue.path.join('.');

    // Create human-readable code descriptions
    const codeMap: Record<string, string> = {
      'invalid_type': 'Type mismatch',
      'invalid_literal': 'Invalid value',
      'custom': 'Validation failed',
      'invalid_union': 'Not one of allowed values',
      'invalid_enum': 'Not a valid enum value',
      'unrecognized_keys': 'Unexpected properties',
      'invalid_arguments': 'Invalid arguments',
      'invalid_return_type': 'Invalid return value',
      'invalid_date': 'Invalid date format',
      'invalid_string': 'Invalid string format',
      'too_small': 'Value too small',
      'too_big': 'Value too large',
      'not_multiple_of': 'Not a multiple of required value',
      'not_finite': 'Must be a finite number'
    };

    const codeLabel = codeMap[issue.code as keyof typeof codeMap] || issue.code;

    return {
      field: field || 'root',
      message: issue.message,
      code: codeLabel,
      received: 'received' in issue ? issue.received : undefined
    };
  });
}

/**
 * Validate arguments against a Zod schema with comprehensive error handling
 *
 * @example
 * ```typescript
 * const result = validateWithSchema(args, MyArgsSchema);
 * if (!result.success) {
 *   return createValidationErrorResponse(result.errors!);
 * }
 * const validatedArgs = result.data;
 * ```
 */
export function validateWithSchema<T>(
  data: unknown,
  schema: z.ZodType<T>
): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = formatZodError(error);
      logger.warn(`Validation failed with ${formattedErrors.length} error(s):`, formattedErrors);
      return {
        success: false,
        errors: formattedErrors,
        rawError: error
      };
    }

    // Non-Zod error (shouldn't happen, but handle it)
    logger.error('Unexpected error during validation:', error);
    return {
      success: false,
      errors: [{
        field: 'unknown',
        message: error instanceof Error ? error.message : String(error),
        code: 'unknown_error'
      }]
    };
  }
}

/**
 * Create a formatted MCP error response from validation errors
 *
 * @example
 * ```typescript
 * const response = createValidationErrorResponse(errors);
 * return response; // Ready to return from tool
 * ```
 */
export function createValidationErrorResponse(errors: ValidationError[]): ToolResponse {
  const errorList = errors
    .map((err, idx) => {
      const fieldLabel = err.field ? `**${err.field}**: ` : '';
      return `${idx + 1}. ${fieldLabel}${err.message} (${err.code})`;
    })
    .join('\n');

  const content: Array<{ type: 'text'; text: string }> = [
    {
      type: 'text',
      text: `❌ **Validation Error**\n\n${errorList}`
    }
  ];

  // Add helpful hint if there are common errors
  const hasTypeErrors = errors.some(e => e.code === 'Type mismatch');
  const hasMissingFields = errors.some(e => e.message.includes('Required'));

  if (hasTypeErrors || hasMissingFields) {
    content.push({
      type: 'text',
      text: '**Tip:** Check that all required fields are provided with the correct data types.'
    });
  }

  return {
    content,
    isError: true
  };
}

/**
 * Safe parse with automatic error response generation
 * Perfect for one-liner validation in tool execute methods
 *
 * @example
 * ```typescript
 * const parsed = safeParse(args, MyArgsSchema, 'MyTool');
 * if (!parsed.success) return parsed.error;
 * const validatedArgs = parsed.data;
 * // ... proceed with tool logic
 * ```
 */
export type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: ToolResponse };

export function safeParse<T>(
  data: unknown,
  schema: z.ZodType<T>,
  toolName: string = 'Tool'
): SafeParseResult<T> {
  const result = validateWithSchema(data, schema);

  if (result.success) {
    return {
      success: true,
      data: result.data!
    };
  }

  logger.warn(`${toolName} validation failed: ${result.errors?.length || 0} error(s)`);

  return {
    success: false,
    error: createValidationErrorResponse(result.errors || [])
  };
}

/**
 * Validation middleware decorator for tool execute methods
 * Automatically validates arguments and returns error response on failure
 *
 * @example
 * ```typescript
 * class MyTool {
 *   @validateArgs(MyArgsSchema)
 *   async execute(args: unknown): Promise<ToolResponse> {
 *     // args is guaranteed to be valid here
 *     const { field1, field2 } = args as z.infer<typeof MyArgsSchema>;
 *     // ... tool logic
 *   }
 * }
 * ```
 */
export function validateArgs<T>(schema: z.ZodType<T>) {
  return function decorator(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, args: unknown): Promise<ToolResponse> {
      const result = validateWithSchema(args, schema);

      if (!result.success) {
        logger.warn(`${this.constructor.name}.${propertyKey} validation failed`);
        return createValidationErrorResponse(result.errors || []);
      }

      // Call original method with validated args
      return await originalMethod.call(this, result.data);
    };

    return descriptor;
  };
}

/**
 * Utility: Check if error is a validation error
 */
export function isValidationError(error: unknown): error is z.ZodError {
  return error instanceof z.ZodError;
}

/**
 * Utility: Extract validation errors from a ZodError
 */
export function extractValidationErrors(error: z.ZodError): Map<string, string> {
  const errorMap = new Map<string, string>();

  error.issues.forEach(issue => {
    const field = issue.path.join('.');
    errorMap.set(field || 'root', issue.message);
  });

  return errorMap;
}

/**
 * Combine multiple validation results
 * Useful when validating multiple inputs sequentially
 */
export function combineValidationResults<T1, T2>(
  result1: ValidationResult<T1>,
  result2: ValidationResult<T2>
): ValidationResult<[T1, T2]> | ValidationResult<null> {
  const allErrors: ValidationError[] = [];

  if (!result1.success && result1.errors) {
    allErrors.push(...result1.errors.map(e => ({ ...e, field: `input1.${e.field}` })));
  }

  if (!result2.success && result2.errors) {
    allErrors.push(...result2.errors.map(e => ({ ...e, field: `input2.${e.field}` })));
  }

  if (allErrors.length > 0) {
    return {
      success: false,
      errors: allErrors
    };
  }

  if (!result1.success || !result2.success) {
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Validation failed', code: 'unknown_error' }]
    };
  }

  return {
    success: true,
    data: [result1.data!, result2.data!]
  };
}
