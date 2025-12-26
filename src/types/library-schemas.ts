/**
 * Zod schemas for runtime validation of library management types
 *
 * These schemas provide runtime type checking and validation for API inputs
 * and outputs in the AutoHotkey Library Management System.
 */

import { z } from 'zod';

/**
 * Semantic version schema (MAJOR.MINOR.PATCH)
 */
export const SemanticVersionSchema = z.object({
  major: z.number().int().nonnegative(),
  minor: z.number().int().nonnegative(),
  patch: z.number().int().nonnegative(),
});

/**
 * Property information schema
 */
export const PropertyInfoSchema = z.object({
  name: z.string().min(1),
  line: z.number().int().positive(),
  isStatic: z.boolean(),
  type: z.string().optional(),
});

/**
 * Method information schema
 */
export const MethodInfoSchema = z
  .object({
    name: z.string().min(1),
    startLine: z.number().int().positive(),
    endLine: z.number().int().positive(),
    isStatic: z.boolean(),
    parameters: z.array(z.string()).optional(),
    returnType: z.string().optional(),
  })
  .refine(data => data.startLine <= data.endLine, {
    message: 'startLine must be <= endLine',
  });

/**
 * Class information schema
 */
export const ClassInfoSchema = z
  .object({
    name: z.string().min(1),
    startLine: z.number().int().positive(),
    endLine: z.number().int().positive(),
    baseClass: z.string().optional(),
    methods: z.array(MethodInfoSchema),
    properties: z.array(PropertyInfoSchema),
    documentation: z.string().optional(),
  })
  .refine(data => data.startLine <= data.endLine, {
    message: 'startLine must be <= endLine',
  });

/**
 * Function information schema
 */
export const FunctionInfoSchema = z
  .object({
    name: z.string().min(1),
    startLine: z.number().int().positive(),
    endLine: z.number().int().positive(),
    parameters: z.array(z.string()).optional(),
    returnType: z.string().optional(),
    documentation: z.string().optional(),
  })
  .refine(data => data.startLine <= data.endLine, {
    message: 'startLine must be <= endLine',
  });

/**
 * JSDoc tag schema
 */
export const JSDocTagSchema = z.object({
  tag: z.string().min(1),
  value: z.string(),
});

/**
 * Documentation information schema
 */
export const DocumentationInfoSchema = z.object({
  description: z.string().optional(),
  examples: z.array(z.string()),
  jsdocTags: z.array(JSDocTagSchema),
  author: z.string().optional(),
  credits: z.array(z.string()).optional(),
});

/**
 * Dependency information schema
 */
export const DependencyInfoSchema = z.object({
  source: z.string().min(1),
  target: z.string().min(1),
  versionConstraint: z.string().optional(),
  type: z.enum(['direct', 'transitive']),
  includeDirective: z.string().min(1),
});

/**
 * Library metadata schema
 */
export const LibraryMetadataSchema = z.object({
  name: z.string().min(1),
  filePath: z.string().min(1),
  version: z.string().optional(),
  semanticVersion: SemanticVersionSchema.optional(),
  dependencies: z.array(z.string()),
  dependencyInfo: z.array(DependencyInfoSchema),
  classes: z.array(ClassInfoSchema),
  functions: z.array(FunctionInfoSchema),
  documentation: DocumentationInfoSchema,
  globalVars: z.array(z.string()),
  category: z.string().optional(),
  fileSize: z.number().int().nonnegative(),
  lastModified: z.number().int().positive(),
  lineCount: z.number().int().positive(),
});

/**
 * Search query schema for MCP tool input
 */
export const SearchQuerySchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  hasDependencies: z.boolean().optional(),
  hasVersion: z.boolean().optional(),
});

/**
 * Library info request schema for MCP tool input
 */
export const LibraryInfoRequestSchema = z.object({
  libraryName: z.string().min(1),
  includeDependencies: z.boolean().optional().default(true),
  includeExamples: z.boolean().optional().default(true),
});

/**
 * Import request schema for MCP tool input
 */
export const ImportRequestSchema = z.object({
  libraryName: z.string().min(1),
  userScriptPath: z.string().optional(),
  includeBoilerplate: z.boolean().optional().default(true),
});

/**
 * Compatibility result schema
 */
export const CompatibilityResultSchema = z.object({
  compatible: z.boolean(),
  error: z.string().optional(),
  warning: z.string().optional(),
  details: z.string().optional(),
});

/**
 * Version conflict schema
 */
export const VersionConflictSchema = z.object({
  library: z.string().min(1),
  requiredBy: z.array(z.string()),
  requiredVersions: z.array(z.string()),
  availableVersion: z.string().optional(),
});

/**
 * Dependency resolution schema
 */
export const DependencyResolutionSchema = z.object({
  importOrder: z.array(z.string()),
  cycles: z.array(z.array(z.string())),
  missing: z.array(z.string()),
  conflicts: z.array(VersionConflictSchema),
});

/**
 * Catalog statistics schema
 */
export const CatalogStatsSchema = z.object({
  totalLibraries: z.number().int().nonnegative(),
  versionedLibraries: z.number().int().nonnegative(),
  librariesWithDependencies: z.number().int().nonnegative(),
  totalClasses: z.number().int().nonnegative(),
  totalFunctions: z.number().int().nonnegative(),
  categoryCounts: z.map(z.string(), z.number().int().nonnegative()),
  lastRefresh: z.number().int().positive(),
});

/**
 * Import result schema
 */
export const ImportResultSchema = z.object({
  success: z.boolean(),
  includeStatements: z.array(z.string()),
  boilerplate: z.string().optional(),
  warnings: z.array(z.string()),
  errors: z.array(z.string()),
  resolution: DependencyResolutionSchema.optional(),
});

// Type inference helpers
export type SearchQueryInput = z.infer<typeof SearchQuerySchema>;
export type LibraryInfoRequestInput = z.infer<typeof LibraryInfoRequestSchema>;
export type ImportRequestInput = z.infer<typeof ImportRequestSchema>;
