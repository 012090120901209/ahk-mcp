/**
 * Library Scanner
 *
 * Scans the scripts/ directory for AutoHotkey library files (.ahk extension).
 * Returns absolute paths to all discovered library files.
 */

import { promises as fs } from 'fs';
import path from 'path';
import logger from '../logger.js';

/**
 * Scanner for AutoHotkey library files
 */
export class LibraryScanner {
  /**
   * Scan a directory for .ahk library files
   *
   * @param scriptsDir - Absolute path to the scripts directory
   * @returns Array of absolute paths to .ahk files, sorted alphabetically
   * @throws Error if directory doesn't exist or can't be read
   */
  async scanDirectory(scriptsDir: string): Promise<string[]> {
    const startTime = Date.now();

    try {
      // Verify directory exists
      const stats = await fs.stat(scriptsDir);
      if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${scriptsDir}`);
      }

      // Read directory contents
      const entries = await fs.readdir(scriptsDir, { withFileTypes: true });

      // Filter for .ahk files only
      const ahkFiles = entries
        .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.ahk'))
        .map(entry => path.join(scriptsDir, entry.name));

      // Sort alphabetically for consistent ordering
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
