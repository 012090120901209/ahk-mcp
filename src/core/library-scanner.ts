/**
 * Library Scanner
 *
 * Scans directories for AutoHotkey library files (.ahk extension).
 * Supports multiple directories, recursive scanning, and standard AHK library paths.
 */

import { promises as fs } from 'fs';
import path from 'path';
import logger from '../logger.js';

export interface ScanOptions {
  /** Scan subdirectories recursively */
  recursive?: boolean;
  /** Maximum depth for recursive scanning (default: 3) */
  maxDepth?: number;
  /** Include hidden files/folders (starting with .) */
  includeHidden?: boolean;
}

export interface ScanResult {
  /** All discovered .ahk file paths */
  files: string[];
  /** Directories that were scanned */
  scannedDirs: string[];
  /** Directories that failed to scan */
  failedDirs: { path: string; error: string }[];
  /** Scan duration in ms */
  duration: number;
}

/**
 * Scanner for AutoHotkey library files
 */
export class LibraryScanner {
  /**
   * Scan a directory for .ahk library files
   *
   * @param scriptsDir - Absolute path to the scripts directory
   * @param options - Scan options
   * @returns Array of absolute paths to .ahk files, sorted alphabetically
   * @throws Error if directory doesn't exist or can't be read
   */
  async scanDirectory(scriptsDir: string, options?: ScanOptions): Promise<string[]> {
    const startTime = Date.now();
    const recursive = options?.recursive ?? false;
    const maxDepth = options?.maxDepth ?? 3;
    const includeHidden = options?.includeHidden ?? false;

    const ahkFiles: string[] = [];

    const scanDir = async (dir: string, depth: number): Promise<void> => {
      if (depth > maxDepth) return;

      try {
        const stats = await fs.stat(dir);
        if (!stats.isDirectory()) return;

        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          // Skip hidden files/folders unless requested
          if (!includeHidden && entry.name.startsWith('.')) continue;

          const fullPath = path.join(dir, entry.name);

          if (entry.isFile() && entry.name.toLowerCase().endsWith('.ahk')) {
            ahkFiles.push(fullPath);
          } else if (entry.isDirectory() && recursive) {
            await scanDir(fullPath, depth + 1);
          }
        }
      } catch (error) {
        // Log but don't throw for individual directory failures in recursive mode
        if (recursive) {
          logger.debug(`[LibraryScanner] Skipping directory ${dir}: ${(error as Error).message}`);
        } else {
          throw error;
        }
      }
    };

    try {
      await scanDir(scriptsDir, 0);
      ahkFiles.sort();

      const elapsed = Date.now() - startTime;
      logger.debug(`[LibraryScanner] Found ${ahkFiles.length} .ahk files in ${elapsed}ms`);

      return ahkFiles;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Directory not found: ${scriptsDir}`);
      } else if ((error as NodeJS.ErrnoException).code === 'EACCES') {
        throw new Error(`Permission denied reading directory: ${scriptsDir}`);
      } else {
        throw new Error(`Failed to scan directory ${scriptsDir}: ${(error as Error).message}`);
      }
    }
  }

  /**
   * Scan multiple directories for .ahk library files
   *
   * @param directories - Array of directory paths to scan
   * @param options - Scan options
   * @returns Detailed scan result with all files and status
   */
  async scanMultipleDirectories(directories: string[], options?: ScanOptions): Promise<ScanResult> {
    const startTime = Date.now();
    const allFiles: Set<string> = new Set();
    const scannedDirs: string[] = [];
    const failedDirs: { path: string; error: string }[] = [];

    for (const dir of directories) {
      try {
        const files = await this.scanDirectory(dir, options);
        files.forEach(f => allFiles.add(f));
        scannedDirs.push(dir);
      } catch (error) {
        failedDirs.push({
          path: dir,
          error: (error as Error).message,
        });
      }
    }

    const files = Array.from(allFiles).sort();
    const duration = Date.now() - startTime;

    logger.debug(
      `[LibraryScanner] Multi-dir scan: ${files.length} files from ${scannedDirs.length} dirs in ${duration}ms`
    );

    return { files, scannedDirs, failedDirs, duration };
  }

  /**
   * Check if a file is an AutoHotkey library file
   *
   * @param filePath - Path to check
   * @returns true if file is a .ahk file
   */
  isAhkFile(filePath: string): boolean {
    return path.extname(filePath).toLowerCase() === '.ahk';
  }

  /**
   * Get library name from file path
   *
   * @param filePath - Absolute path to library file
   * @returns Library name (filename without .ahk extension)
   */
  getLibraryName(filePath: string): string {
    return path.basename(filePath, '.ahk');
  }

  /**
   * Scan directory and return library names instead of paths
   *
   * @param scriptsDir - Absolute path to the scripts directory
   * @returns Array of library names (without .ahk extension)
   */
  async scanLibraryNames(scriptsDir: string): Promise<string[]> {
    const files = await this.scanDirectory(scriptsDir);
    return files.map(filePath => this.getLibraryName(filePath));
  }
}
