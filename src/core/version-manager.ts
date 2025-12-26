/**
 * Version Manager
 *
 * Handles semantic versioning for AutoHotkey libraries including:
 * - Parsing version strings (MAJOR.MINOR.PATCH)
 * - Checking version compatibility
 * - Formatting versions
 */

import type { SemanticVersion, CompatibilityResult } from '../types/library-types.js';

/**
 * Manages semantic versioning for libraries
 */
export class VersionManager {
  /**
   * Parse a semantic version string
   *
   * @param versionString - Version string in format "MAJOR.MINOR.PATCH"
   * @returns Semantic version object, or null if invalid
   */
  parseVersion(versionString: string): SemanticVersion | null {
    const match = versionString.trim().match(/^(\d+)\.(\d+)\.(\d+)$/);

    if (!match) {
      return null;
    }

    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
    };
  }

  /**
   * Format a semantic version object as a string
   *
   * @param version - Semantic version object
   * @returns Formatted version string
   */
  formatVersion(version: SemanticVersion): string {
    return `${version.major}.${version.minor}.${version.patch}`;
  }

  /**
   * Check compatibility between required and available versions
   *
   * Compatibility rules:
   * - Same MAJOR version = compatible
   * - Different MAJOR version = breaking change (incompatible)
   * - Unversioned libraries = warn but allow
   *
   * @param required - Required version string
   * @param available - Available version string
   * @returns Compatibility result with status and messages
   */
  checkCompatibility(required: string, available: string): CompatibilityResult {
    const reqVersion = this.parseVersion(required);
    const availVersion = this.parseVersion(available);

    // Both unversioned
    if (!reqVersion && !availVersion) {
      return {
        compatible: true,
        warning: 'Both libraries are unversioned - compatibility cannot be verified',
      };
    }

    // One is unversioned
    if (!reqVersion || !availVersion) {
      return {
        compatible: true,
        warning: reqVersion
          ? `Required version ${required} but library is unversioned`
          : `Library version ${available} but no version requirement specified`,
      };
    }

    // Check MAJOR version compatibility
    if (reqVersion.major !== availVersion.major) {
      return {
        compatible: false,
        error:
          `Breaking change: required v${required} (MAJOR ${reqVersion.major}), ` +
          `available v${available} (MAJOR ${availVersion.major})`,
        details: 'MAJOR version mismatch indicates breaking changes',
      };
    }

    // Same MAJOR version - check MINOR and PATCH
    if (availVersion.minor < reqVersion.minor) {
      return {
        compatible: false,
        error: `Required v${required}, available v${available} - missing features`,
        details: 'Available version is older and may be missing required features',
      };
    }

    if (availVersion.minor === reqVersion.minor && availVersion.patch < reqVersion.patch) {
      return {
        compatible: true,
        warning: `Required v${required}, available v${available} - may be missing bug fixes`,
        details: 'Patch version is older but should be compatible',
      };
    }

    // Fully compatible
    if (availVersion.minor > reqVersion.minor || availVersion.patch > reqVersion.patch) {
      return {
        compatible: true,
        details: `Available v${available} is newer than required v${required} (backward compatible)`,
      };
    }

    // Exact match
    return {
      compatible: true,
      details: `Exact version match: v${available}`,
    };
  }

  /**
   * Compare two semantic versions
   *
   * @param v1 - First version
   * @param v2 - Second version
   * @returns -1 if v1 < v2, 0 if equal, 1 if v1 > v2
   */
  compareVersions(v1: SemanticVersion, v2: SemanticVersion): number {
    if (v1.major !== v2.major) {
      return v1.major < v2.major ? -1 : 1;
    }
    if (v1.minor !== v2.minor) {
      return v1.minor < v2.minor ? -1 : 1;
    }
    if (v1.patch !== v2.patch) {
      return v1.patch < v2.patch ? -1 : 1;
    }
    return 0;
  }

  /**
   * Check if a version satisfies a constraint
   *
   * @param version - Version to check
   * @param constraint - Version constraint (currently only exact match)
   * @returns true if version satisfies constraint
   */
  satisfiesConstraint(version: string, constraint: string): boolean {
    const v = this.parseVersion(version);
    const c = this.parseVersion(constraint);

    if (!v || !c) {
      return false;
    }

    // For now, only support exact MAJOR version match
    // Future: support ranges like ">=1.0.0 <2.0.0"
    return v.major === c.major;
  }

  /**
   * Get the latest version from a list of version strings
   *
   * @param versions - Array of version strings
   * @returns Latest version string, or null if no valid versions
   */
  getLatestVersion(versions: string[]): string | null {
    const parsed = versions
      .map(v => ({ str: v, ver: this.parseVersion(v) }))
      .filter(p => p.ver !== null) as Array<{ str: string; ver: SemanticVersion }>;

    if (parsed.length === 0) {
      return null;
    }

    parsed.sort((a, b) => this.compareVersions(b.ver, a.ver));
    return parsed[0].str;
  }

  /**
   * Increment a version component
   *
   * @param version - Semantic version
   * @param component - Component to increment ('major', 'minor', or 'patch')
   * @returns New semantic version
   */
  incrementVersion(
    version: SemanticVersion,
    component: 'major' | 'minor' | 'patch'
  ): SemanticVersion {
    switch (component) {
      case 'major':
        return { major: version.major + 1, minor: 0, patch: 0 };
      case 'minor':
        return { major: version.major, minor: version.minor + 1, patch: 0 };
      case 'patch':
        return { major: version.major, minor: version.minor, patch: version.patch + 1 };
    }
  }

  /**
   * Check if version indicates a breaking change from a base version
   *
   * @param baseVersion - Base version string
   * @param newVersion - New version string
   * @returns true if new version has breaking changes
   */
  isBreakingChange(baseVersion: string, newVersion: string): boolean {
    const base = this.parseVersion(baseVersion);
    const newer = this.parseVersion(newVersion);

    if (!base || !newer) {
      return false;
    }

    return newer.major > base.major;
  }
}
