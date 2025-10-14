/**
 * TypeScript type definitions for AutoHotkey Library Management System
 *
 * These types define the structure of library metadata, dependencies, versioning,
 * and documentation extracted from AutoHotkey v2 library files.
 */

/**
 * Semantic version following MAJOR.MINOR.PATCH format
 */
export interface SemanticVersion {
  /** Major version - breaking changes */
  major: number;
  /** Minor version - backward-compatible features */
  minor: number;
  /** Patch version - backward-compatible fixes */
  patch: number;
}

/**
 * Information about a class property
 */
export interface PropertyInfo {
  /** Property name */
  name: string;
  /** Line number where property is defined */
  line: number;
  /** Whether the property is static */
  isStatic: boolean;
  /** Optional type annotation or inferred type */
  type?: string;
}

/**
 * Information about a class method
 */
export interface MethodInfo {
  /** Method name */
  name: string;
  /** Starting line number */
  startLine: number;
  /** Ending line number */
  endLine: number;
  /** Whether the method is static */
  isStatic: boolean;
  /** Method parameters (if available) */
  parameters?: string[];
  /** Return type (if documented) */
  returnType?: string;
}

/**
 * Information about a class definition
 */
export interface ClassInfo {
  /** Class name */
  name: string;
  /** Starting line number */
  startLine: number;
  /** Ending line number */
  endLine: number;
  /** Base class name (if extends another class) */
  baseClass?: string;
  /** Methods defined in this class */
  methods: MethodInfo[];
  /** Properties defined in this class */
  properties: PropertyInfo[];
  /** Class-level documentation */
  documentation?: string;
}

/**
 * Information about a standalone function
 */
export interface FunctionInfo {
  /** Function name */
  name: string;
  /** Starting line number */
  startLine: number;
  /** Ending line number */
  endLine: number;
  /** Function parameters (if available) */
  parameters?: string[];
  /** Return type (if documented) */
  returnType?: string;
  /** Function documentation */
  documentation?: string;
}

/**
 * JSDoc tag information
 */
export interface JSDocTag {
  /** Tag name (e.g., "param", "returns", "example") */
  tag: string;
  /** Tag value/content */
  value: string;
}

/**
 * Documentation information extracted from comments
 */
export interface DocumentationInfo {
  /** Main description text */
  description?: string;
  /** Code examples */
  examples: string[];
  /** JSDoc tags parsed from structured comments */
  jsdocTags: JSDocTag[];
  /** Author information (if available) */
  author?: string;
  /** Credits/acknowledgments */
  credits?: string[];
}

/**
 * Dependency relationship between libraries
 */
export interface DependencyInfo {
  /** Source library (the one that requires the dependency) */
  source: string;
  /** Target library (the required dependency) */
  target: string;
  /** Version constraint (if specified) */
  versionConstraint?: string;
  /** Type of dependency: direct or transitive */
  type: 'direct' | 'transitive';
  /** Original #Include directive text */
  includeDirective: string;
}

/**
 * Complete metadata for a library file
 */
export interface LibraryMetadata {
  /** Library name (typically filename without .ahk extension) */
  name: string;
  /** Absolute path to the library file */
  filePath: string;
  /** Semantic version (if available) */
  version?: string;
  /** Parsed semantic version */
  semanticVersion?: SemanticVersion;
  /** List of dependency names */
  dependencies: string[];
  /** Detailed dependency information */
  dependencyInfo: DependencyInfo[];
  /** Classes defined in this library */
  classes: ClassInfo[];
  /** Standalone functions defined in this library */
  functions: FunctionInfo[];
  /** Library documentation */
  documentation: DocumentationInfo;
  /** Global variables declared */
  globalVars: string[];
  /** Category/tags for classification */
  category?: string;
  /** File size in bytes */
  fileSize: number;
  /** Last modified timestamp (mtime) */
  lastModified: number;
  /** Number of lines in the file */
  lineCount: number;
}

/**
 * Search query parameters for library catalog
 */
export interface SearchQuery {
  /** Text query to search in name and description */
  query?: string;
  /** Filter by category */
  category?: string;
  /** Filter by whether library has dependencies */
  hasDependencies?: boolean;
  /** Filter by whether library is versioned */
  hasVersion?: boolean;
}

/**
 * Request to get library information
 */
export interface LibraryInfoRequest {
  /** Library name to get info for */
  libraryName: string;
  /** Include dependency tree in response */
  includeDependencies?: boolean;
  /** Include examples in response */
  includeExamples?: boolean;
}

/**
 * Request to generate import statements
 */
export interface ImportRequest {
  /** Library name to import */
  libraryName: string;
  /** Optional path to user's script (for relative path resolution) */
  userScriptPath?: string;
  /** Include initialization boilerplate */
  includeBoilerplate?: boolean;
}

/**
 * Result of version compatibility check
 */
export interface CompatibilityResult {
  /** Whether versions are compatible */
  compatible: boolean;
  /** Error message if incompatible */
  error?: string;
  /** Warning message (e.g., for unversioned libraries) */
  warning?: string;
  /** Detailed compatibility info */
  details?: string;
}

/**
 * Result of dependency resolution
 */
export interface DependencyResolution {
  /** Ordered list of libraries (dependencies before dependents) */
  importOrder: string[];
  /** Detected circular dependencies */
  cycles: string[][];
  /** Missing dependencies */
  missing: string[];
  /** Version conflicts */
  conflicts: VersionConflict[];
}

/**
 * Version conflict between dependencies
 */
export interface VersionConflict {
  /** Library with conflicting version requirements */
  library: string;
  /** Required by library A */
  requiredBy: string[];
  /** Required versions */
  requiredVersions: string[];
  /** Available version */
  availableVersion?: string;
}

/**
 * Library catalog statistics
 */
export interface CatalogStats {
  /** Total number of libraries */
  totalLibraries: number;
  /** Number of versioned libraries */
  versionedLibraries: number;
  /** Number of libraries with dependencies */
  librariesWithDependencies: number;
  /** Total classes across all libraries */
  totalClasses: number;
  /** Total functions across all libraries */
  totalFunctions: number;
  /** Categories and their counts */
  categoryCounts: Map<string, number>;
  /** Last catalog refresh timestamp */
  lastRefresh: number;
}

/**
 * Library import result
 */
export interface ImportResult {
  /** Whether import generation succeeded */
  success: boolean;
  /** Generated #Include statements */
  includeStatements: string[];
  /** Generated initialization code */
  boilerplate?: string;
  /** Warnings about the import */
  warnings: string[];
  /** Errors that occurred */
  errors: string[];
  /** Dependency resolution details */
  resolution?: DependencyResolution;
}
