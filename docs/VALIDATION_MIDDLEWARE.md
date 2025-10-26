# Validation Middleware Guide

The validation middleware (`src/core/validation-middleware.ts`) provides centralized, consistent error handling for Zod schema validation across all MCP tools.

## Overview

This utility eliminates inconsistent validation error handling by:
- ✅ Formatting Zod errors into field-level issues
- ✅ Generating consistent MCP error responses
- ✅ Logging validation failures with context
- ✅ Providing decorator-based validation
- ✅ Supporting one-liner validation patterns

## Quick Start

### Option 1: Safe Parse (Recommended for Most Tools)

```typescript
import { safeParse, MyArgsSchema } from '../core/validation-middleware.js';

export class MyTool {
  async execute(args: unknown): Promise<ToolResponse> {
    // One-liner validation
    const parsed = safeParse(args, MyArgsSchema, 'MyTool');
    if (!parsed.success) return parsed.error;

    // args is now typed and validated
    const { filePath, content } = parsed.data;
    // ... continue with tool logic
  }
}
```

### Option 2: Detailed Validation Result

For cases where you need to handle validation differently:

```typescript
import { validateWithSchema, createValidationErrorResponse, MyArgsSchema } from '../core/validation-middleware.js';

export class MyTool {
  async execute(args: unknown): Promise<ToolResponse> {
    const result = validateWithSchema(args, MyArgsSchema);

    if (!result.success) {
      // Custom error handling
      logger.warn(`Validation failed for ${result.errors?.length || 0} fields`);
      return createValidationErrorResponse(result.errors!);
    }

    const validatedArgs = result.data;
    // ... proceed with logic
  }
}
```

### Option 3: Decorator Pattern (TypeScript Only)

```typescript
import { validateArgs, MyArgsSchema } from '../core/validation-middleware.js';

export class MyTool {
  @validateArgs(MyArgsSchema)
  async execute(args: z.infer<typeof MyArgsSchema>): Promise<ToolResponse> {
    // args is guaranteed to be valid here
    const { filePath, content } = args;
    // ... tool logic (decorator handles errors automatically)
  }
}
```

## API Reference

### Functions

#### `safeParse<T>(data, schema, toolName?): SafeParseResult<T>`

One-liner validation that returns either `{ success: true, data }` or `{ success: false, error }`.

**Usage:**
```typescript
const parsed = safeParse(args, ArgsSchema, 'ToolName');
if (!parsed.success) return parsed.error;
const validated = parsed.data; // Typed correctly
```

---

#### `validateWithSchema<T>(data, schema): ValidationResult<T>`

Detailed validation that returns all issues and original error.

**Returns:**
```typescript
{
  success: true,
  data: T
} | {
  success: false,
  errors: ValidationError[],
  rawError: ZodError
}
```

**Usage:**
```typescript
const result = validateWithSchema(args, ArgsSchema);
if (!result.success) {
  console.log(result.errors); // Array of field-level errors
  console.log(result.rawError); // Original ZodError for detailed inspection
}
```

---

#### `createValidationErrorResponse(errors): ToolResponse`

Formats validation errors into an MCP-compliant error response.

**Output Example:**
```
❌ **Validation Error**

1. **filePath**: Required (Type mismatch)
2. **timeout**: Must be between 0 and 60000 (Value too large)

**Tip:** Check that all required fields are provided with the correct data types.
```

---

#### `formatZodError(error): ValidationError[]`

Extracts and formats Zod validation issues. Used internally by `validateWithSchema`.

**Returns:**
```typescript
[
  {
    field: 'filePath',
    message: 'String is required',
    code: 'Type mismatch',
    received: 123
  },
  {
    field: 'timeout',
    message: 'Number must be less than or equal to 60000',
    code: 'Value too large',
    received: 99999
  }
]
```

---

#### `@validateArgs<T>(schema): Decorator`

Class method decorator that validates execute() arguments automatically.

**Usage:**
```typescript
import { validateArgs } from '../core/validation-middleware.js';

export class AhkEditTool {
  @validateArgs(AhkEditArgsSchema)
  async execute(args: z.infer<typeof AhkEditArgsSchema>): Promise<ToolResponse> {
    // args is guaranteed valid; validation errors are handled automatically
    const { action, filePath } = args;
    // ... proceed with tool logic
  }
}
```

---

#### `extractValidationErrors(error): Map<string, string>`

Converts ZodError into a field-to-message map for custom handling.

**Usage:**
```typescript
const errorMap = extractValidationErrors(zodError);
errorMap.forEach((message, field) => {
  console.log(`${field}: ${message}`);
});
```

---

#### `combineValidationResults<T1, T2>(result1, result2): ValidationResult`

Combines multiple validation results into a single result with all errors.

**Usage:**
```typescript
const r1 = validateWithSchema(data1, Schema1);
const r2 = validateWithSchema(data2, Schema2);
const combined = combineValidationResults(r1, r2);

if (!combined.success) {
  // All errors from both validations
  return createValidationErrorResponse(combined.errors!);
}
```

---

### Types

#### `ValidationError`
```typescript
interface ValidationError {
  field: string;              // Field path (e.g., "filePath", "options.timeout")
  message: string;            // Human-readable error message
  code: string;               // Error type (e.g., "Type mismatch", "Required")
  received?: unknown;         // The value that was received
}
```

#### `ValidationResult<T>`
```typescript
interface ValidationResult<T> {
  success: boolean;
  data?: T;                   // Validated data (if success: true)
  errors?: ValidationError[]; // Field errors (if success: false)
  rawError?: z.ZodError;      // Original ZodError (if success: false)
}
```

#### `SafeParseResult<T>`
```typescript
type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: ToolResponse };
```

## Integration Guide

### Step 1: Import the middleware

```typescript
import { safeParse } from '../core/validation-middleware.js';
```

### Step 2: Replace existing validation pattern

**Before:**
```typescript
async execute(args: z.infer<typeof MyArgsSchema>): Promise<ToolResponse> {
  try {
    const validatedArgs = MyArgsSchema.parse(args);
    // ... tool logic
  } catch (error) {
    logger.error('Error:', error);
    return { content: [{ type: 'text', text: `Error: ${error}` }], isError: true };
  }
}
```

**After:**
```typescript
async execute(args: unknown): Promise<ToolResponse> {
  const parsed = safeParse(args, MyArgsSchema, 'MyTool');
  if (!parsed.success) return parsed.error;

  const validatedArgs = parsed.data;
  // ... tool logic (no try-catch needed for validation)
}
```

### Step 3: Apply to other tools

Recommended tools to update (in priority order):
1. `ahk-system-config.ts` - Complex config validation
2. `ahk-run-script.ts` - Multiple validation branches
3. `ahk-analyze-diagnostics.ts` - Severity enum validation
4. `ahk-file-edit-small.ts` - Multi-action validation
5. All remaining tools for consistency

## Error Response Examples

### Example 1: Type Mismatch
```
❌ **Validation Error**

1. **timeout**: Expected number, received string (Type mismatch)
2. **backup**: Expected boolean, received null (Type mismatch)

**Tip:** Check that all required fields are provided with the correct data types.
```

### Example 2: Missing Required Fields
```
❌ **Validation Error**

1. **filePath**: Required (Type mismatch)
2. **content**: String is required (Type mismatch)

**Tip:** Check that all required fields are provided with the correct data types.
```

### Example 3: Invalid Enum
```
❌ **Validation Error**

1. **action**: Not a valid enum value (Not one of allowed values)

**Tip:** Check that all required fields are provided with the correct data types.
```

## Best Practices

### ✅ Do

- Use `safeParse()` for the most readable code in most tools
- Include the tool name in `safeParse()` for better logging
- Return validation error responses immediately
- Let the middleware format ZodErrors (don't catch and stringify them)
- Group validation at the start of execute() methods

### ❌ Don't

- Mix manual Zod error handling with the middleware
- Catch validation errors without formatting them
- Validate after transformations (validate first, transform after)
- Use `.parse()` without surrounding try-catch if not using middleware
- Create custom error responses for validation failures

## Migration Checklist

- [ ] Create validation-middleware.ts ✅
- [ ] Update 3-5 high-traffic tools (ahk-system-config, ahk-run-script, etc.)
- [ ] Run full build to verify types
- [ ] Test tools with invalid arguments
- [ ] Document in project CLAUDE.md
- [ ] Optional: Use @validateArgs decorator for future tools

## Advanced Usage

### Custom Error Handling

```typescript
const result = validateWithSchema(args, MyArgsSchema);

if (!result.success) {
  // Access individual errors
  const fieldErrors = new Map(
    result.errors!.map(e => [e.field, e.message])
  );

  // Custom logic based on error type
  if (fieldErrors.has('filePath')) {
    // Handle missing file path specifically
  }

  return createValidationErrorResponse(result.errors!);
}
```

### Conditional Validation

```typescript
const baseResult = validateWithSchema(args, BaseSchema);
if (!baseResult.success) {
  return createValidationErrorResponse(baseResult.errors!);
}

// Additional validation based on action type
if (baseResult.data.action === 'advanced') {
  const advancedResult = validateWithSchema(baseResult.data, AdvancedSchema);
  if (!advancedResult.success) {
    return createValidationErrorResponse(advancedResult.errors!);
  }
}
```

## Related Files

- **Utility:** `src/core/validation-middleware.ts`
- **Error Responses:** `src/utils/response-helpers.ts`
- **Example Usage:** See updated tool files
- **Zod Schema Patterns:** Follow patterns in existing tool files

---

**Last Updated:** October 16, 2025
**Status:** Production Ready ✅
