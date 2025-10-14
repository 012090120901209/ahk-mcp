/**
 * Library Catalog
 *
 * Central catalog for managing AutoHotkey library metadata.
 * Provides search, filtering, and lookup functionality with lazy initialization.
 */

import { LibraryScanner } from './library-scanner.js';
import { MetadataExtractor } from './metadata-extractor.js';
import { DependencyResolver } from './dependency-resolver.js';
import type { LibraryMetadata, CatalogStats } from '../types/library-types.js';
import logger from '../logger.js';

/**
 * Manages the library catalog with lazy initialization
 */
export class LibraryCatalog {
  /** Map of library name to metadata */
  private libraries: Map<string, LibraryMetadata> = new Map();

  /** Whether the catalog has been initialized */
  private initialized: boolean = false;

  /** Path to the scripts directory */
  private scriptsDir: string = '';

  /** Scanner instance */
  private scanner: LibraryScanner;

  /** Metadata extractor instance */
  private extractor: MetadataExtractor;

  /** Dependency resolver instance */
  private resolver: DependencyResolver;

  /** Last initialization timestamp */
  private lastRefresh: number = 0;

  constructor() {
    this.scanner = new LibraryScanner();
    this.extractor = new MetadataExtractor();
    this.resolver = new DependencyResolver();
  }

  /**
   * Initialize the catalog by scanning and analyzing libraries
   *
   * This is called lazily on first use
   *
   * @param scriptsDir - Absolute path to scripts directory
   */
  async initialize(scriptsDir: string): Promise<void> {
    if (this.initialized && this.scriptsDir === scriptsDir) {
      return; // Already initialized for this directory
    }

    const startTime = Date.now();
    this.scriptsDir = scriptsDir;
    this.libraries.clear();

    logger.debug(`[LibraryCatalog] Initializing catalog for ${scriptsDir}`);

    // Scan for library files
    const libraryFiles = await this.scanner.scanDirectory(scriptsDir);
    logger.debug(`[LibraryCatalog] Found ${libraryFiles.length} library files`);

    // Extract metadata from each file
    const extractionPromises = libraryFiles.map(async (filePath) => {
      try {
        const metadata = await this.extractor.extract(filePath);
        this.libraries.set(metadata.name, metadata);
        logger.debug(`[LibraryCatalog] Extracted metadata for ${metadata.name}`);
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
    logger.debug(`[LibraryCatalog] Initialization complete in ${elapsed}ms (${this.libraries.size} libraries)`);
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

    return Array.from(this.libraries.values()).filter(lib =>
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
   * @param scriptsDir - Optional new scripts directory path
   */
  async refresh(scriptsDir?: string): Promise<void> {
    this.initialized = false;
    await this.initialize(scriptsDir || this.scriptsDir);
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
    const librariesWithDependencies = libraries.filter(
      lib => lib.dependencies.length > 0
    ).length;

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
      lastRefresh: this.lastRefresh
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

    // Calculate similarity scores (simple Levenshtein-like heuristic)
    const scored = libraries.map(name => ({
      name,
      score: this.calculateSimilarity(lowerQuery, name.toLowerCase())
    }));

    // Sort by score (higher is more similar)
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, maxResults).map(s => s.name);
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
    score += overlap / Math.max(chars1.size, chars2.size) * 0.3;

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
   * Get scripts directory path
   *
   * @returns Scripts directory path
   */
  getScriptsDir(): string {
    return this.scriptsDir;
  }
}
