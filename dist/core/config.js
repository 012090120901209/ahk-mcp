import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import logger from '../logger.js';
function getConfigDir() {
    const override = process.env.AHK_MCP_CONFIG_DIR;
    if (override && override.trim().length > 0) {
        return path.resolve(override);
    }
    // Prefer roaming app data on Windows; otherwise fall back to home
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    const base = process.platform === 'win32' ? appData : path.join(os.homedir(), '.config');
    return path.join(base, 'ahk-mcp');
}
export function getConfigPath() {
    return path.join(getConfigDir(), 'config.json');
}
export function loadConfig() {
    try {
        const p = getConfigPath();
        if (!fs.existsSync(p))
            return {};
        const text = fs.readFileSync(p, 'utf8');
        const parsed = JSON.parse(text);
        return parsed || {};
    }
    catch (err) {
        logger.warn('Failed to load config; using defaults. Error:', err);
        return {};
    }
}
export function saveConfig(cfg) {
    try {
        const dir = getConfigDir();
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(getConfigPath(), JSON.stringify(cfg, null, 2), 'utf8');
    }
    catch (err) {
        logger.error('Failed to save config:', err);
        throw err;
    }
}
export function normalizeDir(input) {
    if (!input)
        return undefined;
    // Resolve relative paths; keep original drive casing on Windows behavior
    try {
        return path.resolve(input);
    }
    catch {
        return input;
    }
}
export function resolveSearchDirs(argsScriptDir, argsExtraDirs) {
    const cfg = loadConfig();
    const envDir = process.env.AHK_MCP_SCRIPT_DIR;
    const dirs = [];
    const add = (d) => {
        const nd = normalizeDir(d);
        if (!nd)
            return;
        if (!dirs.includes(nd) && fs.existsSync(nd))
            dirs.push(nd);
    };
    add(argsScriptDir);
    add(cfg.scriptDir);
    add(envDir);
    // Additional search directories
    (argsExtraDirs || []).forEach(add);
    (cfg.searchDirs || []).forEach(add);
    // Safe fallback to current working directory if nothing else available
    if (dirs.length === 0) {
        add(process.cwd());
    }
    return dirs;
}
/**
 * Update the active file path and save to config
 */
export function setActiveFile(filePath) {
    const cfg = loadConfig();
    const normalized = normalizeDir(filePath);
    if (normalized && fs.existsSync(normalized)) {
        cfg.activeFile = normalized;
        cfg.lastModified = new Date().toISOString();
        // Track auto-detected paths
        if (!cfg.autoDetectedPaths) {
            cfg.autoDetectedPaths = [];
        }
        if (!cfg.autoDetectedPaths.includes(normalized)) {
            cfg.autoDetectedPaths.push(normalized);
            // Keep only last 10 paths
            if (cfg.autoDetectedPaths.length > 10) {
                cfg.autoDetectedPaths = cfg.autoDetectedPaths.slice(-10);
            }
        }
        saveConfig(cfg);
        logger.info(`Active file updated: ${normalized}`);
    }
    else {
        logger.warn(`File does not exist: ${filePath}`);
    }
}
/**
 * Clear the persisted active file entry
 */
export function clearActiveFile() {
    const cfg = loadConfig();
    if (!cfg.activeFile) {
        return;
    }
    delete cfg.activeFile;
    cfg.lastModified = new Date().toISOString();
    saveConfig(cfg);
    logger.info('Active file removed from config');
}
/**
 * Get the active file path
 */
export function getActiveFile() {
    const cfg = loadConfig();
    return cfg.activeFile;
}
/**
 * Persist the most recently edited file path
 */
export function setLastEditedFile(filePath) {
    const normalized = normalizeDir(filePath);
    if (!normalized)
        return;
    if (!fs.existsSync(normalized)) {
        logger.warn(`Last edited file does not exist: ${normalized}`);
        return;
    }
    const cfg = loadConfig();
    cfg.lastEditedFile = normalized;
    cfg.lastEditedAt = new Date().toISOString();
    saveConfig(cfg);
    logger.info(`Last edited file updated: ${normalized}`);
}
/**
 * Get the most recently edited file path
 */
export function getLastEditedFile() {
    const cfg = loadConfig();
    return cfg.lastEditedFile;
}
/**
 * Detect and extract file paths from text
 */
export function detectFilePaths(text) {
    const paths = [];
    // Pattern 1: Quoted paths
    const quotedPaths = text.match(/["']([^"']*\.ahk)["']/gi);
    if (quotedPaths) {
        quotedPaths.forEach(match => {
            const cleaned = match.replace(/["']/g, '');
            paths.push(cleaned);
        });
    }
    // Pattern 2: Paths with drive letters (Windows)
    const drivePaths = text.match(/[A-Z]:(?:\\|\/)[^\s"']+\.ahk/gi);
    if (drivePaths) {
        paths.push(...drivePaths);
    }
    // Pattern 3: Relative paths
    const relativePaths = text.match(/(?:^|\s)(?:\.\/|\.\.\/|[^\s"']+\/)*[^\s"']+\.ahk/gi);
    if (relativePaths) {
        paths.push(...relativePaths.map(p => p.trim()));
    }
    // Pattern 4: Just filename.ahk
    const fileNames = text.match(/\b[\w-]+\.ahk\b/gi);
    if (fileNames) {
        paths.push(...fileNames);
    }
    return [...new Set(paths)]; // Remove duplicates
}
/**
 * Resolve a file path, checking various locations
 */
/**
 * Get standard AutoHotkey library directories
 * These are the default locations AHK searches for libraries
 */
export function getStandardLibraryPaths() {
    const paths = [];
    // 1. User's Documents\AutoHotkey\Lib (highest priority for user libraries)
    const userDocs = process.env.USERPROFILE
        ? path.join(process.env.USERPROFILE, 'Documents', 'AutoHotkey', 'Lib')
        : null;
    if (userDocs && fs.existsSync(userDocs)) {
        paths.push(userDocs);
    }
    // 2. AutoHotkey installation Lib folder
    const ahkPaths = [
        'C:\\Program Files\\AutoHotkey\\v2\\Lib',
        'C:\\Program Files\\AutoHotkey\\Lib',
        'C:\\Program Files (x86)\\AutoHotkey\\v2\\Lib',
    ];
    for (const p of ahkPaths) {
        if (fs.existsSync(p)) {
            paths.push(p);
            break; // Only add one installation path
        }
    }
    // 3. Active file's Lib subfolder (ScriptDir\Lib)
    const activeFile = getActiveFile();
    if (activeFile) {
        const scriptDir = path.dirname(activeFile);
        const scriptLib = path.join(scriptDir, 'Lib');
        if (fs.existsSync(scriptLib) && !paths.includes(scriptLib)) {
            paths.unshift(scriptLib); // Highest priority
        }
    }
    // 4. Configured script directory's Lib subfolder
    const cfg = loadConfig();
    if (cfg.scriptDir) {
        const configLib = path.join(cfg.scriptDir, 'Lib');
        if (fs.existsSync(configLib) && !paths.includes(configLib)) {
            paths.push(configLib);
        }
    }
    return paths;
}
/**
 * Get all library search paths (standard + configured)
 */
export function getAllLibraryPaths() {
    const standard = getStandardLibraryPaths();
    const configured = resolveSearchDirs();
    // Combine and deduplicate
    const allPaths = [...standard];
    for (const p of configured) {
        if (!allPaths.includes(p)) {
            allPaths.push(p);
        }
        // Also check for Lib subfolder in each configured dir
        const libSubfolder = path.join(p, 'Lib');
        if (fs.existsSync(libSubfolder) && !allPaths.includes(libSubfolder)) {
            allPaths.push(libSubfolder);
        }
    }
    return allPaths;
}
export function resolveFilePath(pathOrName) {
    // If it's already an absolute path that exists, return it
    if (path.isAbsolute(pathOrName) && fs.existsSync(pathOrName)) {
        return path.resolve(pathOrName);
    }
    // Check if it exists relative to current directory
    const fromCwd = path.resolve(process.cwd(), pathOrName);
    if (fs.existsSync(fromCwd)) {
        return fromCwd;
    }
    // Check in configured directories
    const searchDirs = resolveSearchDirs();
    for (const dir of searchDirs) {
        const fullPath = path.resolve(dir, pathOrName);
        if (fs.existsSync(fullPath)) {
            return fullPath;
        }
    }
    // Check if there's a script directory set
    const cfg = loadConfig();
    if (cfg.scriptDir) {
        const fromScriptDir = path.resolve(cfg.scriptDir, pathOrName);
        if (fs.existsSync(fromScriptDir)) {
            return fromScriptDir;
        }
    }
    return undefined;
}
