/**
 * Library Catalog
 *
 * Central catalog for managing AutoHotkey library metadata.
 * Provides search, filtering, symbol lookup, and fuzzy matching with lazy initialization.
 */

import { LibraryScanner, type ScanResult } from './library-scanner.js';
import { MetadataExtractor } from './metadata-extractor.js';
import { DependencyResolver } from './dependency-resolver.js';
import { getAllLibraryPaths } from './config.js';
import type { LibraryMetadata, CatalogStats } from '../types/library-types.js';
import logger from '../logger.js';

/** Result from symbol search */
export interface SymbolSearchResult {
  /** Symbol name */
  name: string;
  /** Symbol type: class, method, function, property */
  type: 'class' | 'method' | 'function' | 'property' | 'variable';
  /** Library containing the symbol */
  library: string;
  /** Library file path */
  filePath: string;
  /** Line number (if available) */
  line?: number;
  /** Parent class (for methods/properties) */
  parentClass?: string;
  /** Match score for fuzzy search (0-1) */
  score: number;
}

/**
 * Manages the library catalog with lazy initialization
 */
export class LibraryCatalog {
  /** Map of library name to metadata */
  private libraries: Map<string, LibraryMetadata> = new Map();

  /** Whether the catalog has been initialized */
  private initialized: boolean = false;

  /** Paths that were scanned */
  private scannedPaths: string[] = [];

  /** Scanner instance */
  private scanner: LibraryScanner;

  /** Metadata extractor instance */
  private extractor: MetadataExtractor;

  /** Dependency resolver instance */
  private resolver: DependencyResolver;

  /** Last initialization timestamp */
  private lastRefresh: number = 0;

  /** Last scan result */
  private lastScanResult: ScanResult | null = null;

  constructor() {
    this.scanner = new LibraryScanner();
    this.extractor = new MetadataExtractor();
    this.resolver = new DependencyResolver();
  }

  /**
   * Initialize the catalog by scanning standard AHK library paths
   *
   * Automatically detects:
   * - ScriptDir\Lib (active file's directory)
   * - Documents\AutoHotkey\Lib
   * - Program Files\AutoHotkey\v2\Lib
   * - Configured search directories
   */
  async initializeFromStandardPaths(): Promise<ScanResult> {
    const paths = getAllLibraryPaths();
    return this.initializeFromMultiplePaths(paths);
  }

  /**
   * Initialize the catalog from multiple directories
   *
   * @param directories - Array of directory paths to scan
   */
  async initializeFromMultiplePaths(directories: string[]): Promise<ScanResult> {
    const startTime = Date.now();
    this.libraries.clear();
    this.scannedPaths = [];

    logger.debug(`[LibraryCatalog] Initializing catalog from ${directories.length} directories`);

    // Scan all directories
    const scanResult = await this.scanner.scanMultipleDirectories(directories);
    this.lastScanResult = scanResult;
    this.scannedPaths = scanResult.scannedDirs;

    logger.debug(`[LibraryCatalog] Found ${scanResult.files.length} library files`);

    // Extract metadata from each file
    const extractionPromises = scanResult.files.map(async filePath => {
      try {
        const metadata = await this.extractor.extract(filePath);
        // Use filename as key to avoid duplicates from different paths
        if (!this.libraries.has(metadata.name)) {
          this.libraries.set(metadata.name, metadata);
          logger.debug(`[LibraryCatalog] Extracted metadata for ${metadata.name}`);
        }
      } catch (error) {
        logger.error(`[LibraryCatalog] Failed to extract metadata from ${filePath}:`, error);
      }
    });

    await Promise.all(extractionPromises);

    // Build dependency graph
    this.resolver.buildGraph(Array.from(this.libraries.values()));

    this.initialized = true;
    this.lastRefresh = Date.now();

    const elapsed = Date.now() - startTime;
    logger.debug(
      `[LibraryCatalog] Initialization complete in ${elapsed}ms (${this.libraries.size} libraries)`
    );

    return scanResult;
  }

  /**
   * Initialize the catalog by scanning and analyzing libraries (legacy single-dir)
   *
   * @param scriptsDir - Absolute path to scripts directory
   */
  async initialize(scriptsDir: string): Promise<void> {
    await this.initializeFromMultiplePaths([scriptsDir]);
  }

  /**
   * Get a library by name
   *
   * @param name - Library name (without .ahk extension)
   * @returns Library metadata, or undefined if not found
   */
  get(name: string): LibraryMetadata | undefined {
    this.ensureInitialized();
    return this.libraries.get(name);
  }

  /**
   * Search libraries by query string
   *
   * Searches in library name and description (case-insensitive)
   *
   * @param query - Search query
   * @returns Array of matching libraries
   */
  search(query: string): LibraryMetadata[] {
    this.ensureInitialized();

    if (!query) {
      return Array.from(this.libraries.values());
    }

    const lowerQuery = query.toLowerCase();

    return Array.from(this.libraries.values()).filter(
      lib =>
        lib.name.toLowerCase().includes(lowerQuery) ||
        lib.documentation.description?.toLowerCase().includes(lowerQuery) ||
        lib.category?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Filter libraries by category
   *
   * @param category - Category name (optional)
   * @returns Array of libraries in the category, or all if no category specified
   */
  filter(category?: string): LibraryMetadata[] {
    this.ensureInitialized();

    if (!category) {
      return Array.from(this.libraries.values());
    }

    return Array.from(this.libraries.values()).filter(
      lib => lib.category?.toLowerCase() === category.toLowerCase()
    );
  }

  /**
   * Get all libraries
   *
   * @returns Array of all library metadata
   */
  getAll(): LibraryMetadata[] {
    this.ensureInitialized();
    return Array.from(this.libraries.values());
  }

  /**
   * Get all library names
   *
   * @returns Array of library names
   */
  getLibraryNames(): string[] {
    this.ensureInitialized();
    return Array.from(this.libraries.keys());
  }

  /**
   * Refresh the catalog (re-scan and rebuild)
   *
   * @param directories - Optional new directories to scan (defaults to previously scanned)
   */
  async refresh(directories?: string[]): Promise<void> {
    this.initialized = false;
    const dirsToScan = directories || this.scannedPaths;
    if (dirsToScan.length > 0) {
      await this.initializeFromMultiplePaths(dirsToScan);
    } else {
      await this.initializeFromStandardPaths();
    }
  }

  /**
   * Get catalog statistics
   *
   * @returns Catalog statistics
   */
  getStats(): CatalogStats {
    this.ensureInitialized();

    const libraries = Array.from(this.libraries.values());

    // Count libraries with dependencies
    const librariesWithDependencies = libraries.filter(lib => lib.dependencies.length > 0).length;

    // Count versioned libraries
    const versionedLibraries = libraries.filter(lib => lib.version !== undefined).length;

    // Count total classes and functions
    const totalClasses = libraries.reduce((sum, lib) => sum + lib.classes.length, 0);
    const totalFunctions = libraries.reduce((sum, lib) => sum + lib.functions.length, 0);

    // Count by category
    const categoryCounts = new Map<string, number>();
    for (const lib of libraries) {
      const category = lib.category || 'Uncategorized';
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    }

    return {
      totalLibraries: this.libraries.size,
      versionedLibraries,
      librariesWithDependencies,
      totalClasses,
      totalFunctions,
      categoryCounts,
      lastRefresh: this.lastRefresh,
    };
  }

  /**
   * Get dependency resolver instance
   *
   * @returns Dependency resolver
   */
  getResolver(): DependencyResolver {
    this.ensureInitialized();
    return this.resolver;
  }

  /**
   * Search for symbols (classes, methods, functions, properties) across all libraries
   *
   * @param query - Search query (fuzzy matching supported)
   * @param options - Search options
   * @returns Array of matching symbols with scores
   */
  searchSymbols(
    query: string,
    options: {
      types?: ('class' | 'method' | 'function' | 'property' | 'variable')[];
      maxResults?: number;
      minScore?: number;
    } = {}
  ): SymbolSearchResult[] {
    this.ensureInitialized();

    const { types, maxResults = 50, minScore = 0.3 } = options;
    const lowerQuery = query.toLowerCase();
    const results: SymbolSearchResult[] = [];

    for (const lib of this.libraries.values()) {
      // Search classes
      if (!types || types.includes('class')) {
        for (const cls of lib.classes) {
          const score = this.calculateSimilarity(lowerQuery, cls.name.toLowerCase());
          if (score >= minScore) {
            results.push({
              name: cls.name,
              type: 'class',
              library: lib.name,
              filePath: lib.filePath,
              line: cls.startLine,
              score,
            });
          }

          // Search methods within class
          if (!types || types.includes('method')) {
            for (const method of cls.methods || []) {
              const methodScore = this.calculateSimilarity(lowerQuery, method.name.toLowerCase());
              if (methodScore >= minScore) {
                results.push({
                  name: method.name,
                  type: 'method',
                  library: lib.name,
                  filePath: lib.filePath,
                  line: method.startLine,
                  parentClass: cls.name,
                  score: methodScore,
                });
              }
            }
          }

          // Search properties within class
          if (!types || types.includes('property')) {
            for (const prop of cls.properties || []) {
              const propScore = this.calculateSimilarity(lowerQuery, prop.name.toLowerCase());
              if (propScore >= minScore) {
                results.push({
                  name: prop.name,
                  type: 'property',
                  library: lib.name,
                  filePath: lib.filePath,
                  line: prop.line,
                  parentClass: cls.name,
                  score: propScore,
                });
              }
            }
          }
        }
      }

      // Search functions
      if (!types || types.includes('function')) {
        for (const func of lib.functions) {
          const score = this.calculateSimilarity(lowerQuery, func.name.toLowerCase());
          if (score >= minScore) {
            results.push({
              name: func.name,
              type: 'function',
              library: lib.name,
              filePath: lib.filePath,
              line: func.startLine,
              score,
            });
          }
        }
      }

      // Search global variables
      if (!types || types.includes('variable')) {
        for (const varName of lib.globalVars || []) {
          const score = this.calculateSimilarity(lowerQuery, varName.toLowerCase());
          if (score >= minScore) {
            results.push({
              name: varName,
              type: 'variable',
              library: lib.name,
              filePath: lib.filePath,
              score,
            });
          }
        }
      }
    }

    // Sort by score descending, then by name
    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name);
    });

    return results.slice(0, maxResults);
  }

  /**
   * Fuzzy search for libraries by name
   *
   * @param query - Search query
   * @param maxResults - Maximum results to return
   * @returns Array of libraries sorted by relevance
   */
  fuzzySearch(query: string, maxResults: number = 10): LibraryMetadata[] {
    this.ensureInitialized();

    const lowerQuery = query.toLowerCase();
    const scored = Array.from(this.libraries.values()).map(lib => ({
      lib,
      score: this.calculateSimilarity(lowerQuery, lib.name.toLowerCase()),
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, maxResults).map(s => s.lib);
  }

  /**
   * Find libraries that are similar to a query
   *
   * Used for "did you mean" suggestions when library not found
   *
   * @param query - Library name query
   * @param maxResults - Maximum number of suggestions (default 3)
   * @returns Array of similar library names
   */
  findSimilar(query: string, maxResults: number = 3): string[] {
    this.ensureInitialized();

    const lowerQuery = query.toLowerCase();
    const libraries = Array.from(this.libraries.keys());

    // Calculate similarity scores
    const scored = libraries.map(name => ({
      name,
      score: this.calculateSimilarity(lowerQuery, name.toLowerCase()),
    }));

    // Sort by score (higher is more similar)
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, maxResults).map(s => s.name);
  }

  /**
   * Get scanned library paths
   */
  getScannedPaths(): string[] {
    return [...this.scannedPaths];
  }

  /**
   * Get last scan result
   */
  getLastScanResult(): ScanResult | null {
    return this.lastScanResult;
  }

  /**
   * Calculate simple similarity score between two strings
   *
   * @param s1 - First string
   * @param s2 - Second string
   * @returns Similarity score (0-1, higher is more similar)
   */
  private calculateSimilarity(s1: string, s2: string): number {
    // Simple heuristic: substring match + character overlap
    let score = 0;

    // Substring match bonus
    if (s2.includes(s1)) score += 0.5;
    if (s1.includes(s2)) score += 0.5;

    // Character overlap
    const chars1 = new Set(s1);
    const chars2 = new Set(s2);
    const overlap = [...chars1].filter(c => chars2.has(c)).length;
    score += (overlap / Math.max(chars1.size, chars2.size)) * 0.3;

    // Length similarity
    const lenDiff = Math.abs(s1.length - s2.length);
    score += (1 - lenDiff / Math.max(s1.length, s2.length)) * 0.2;

    return score;
  }

  /**
   * Ensure catalog is initialized
   *
   * @throws Error if not initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(
        'Library catalog not initialized. Call initialize() with scripts directory path first.'
      );
    }
  }

  /**
   * Check if catalog is initialized
   *
   * @returns true if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get primary scripts directory path (first scanned path)
   *
   * @returns Scripts directory path or empty string if not initialized
   */
  getScriptsDir(): string {
    return this.scannedPaths[0] || '';
  }
}
