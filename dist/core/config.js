import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import logger from '../logger.js';
const NOISY_PROJECT_DIRECTORIES = new Set([
    'node_modules',
    '.git',
    '.history',
    'dist',
    'build',
    'coverage',
    'logs',
    'tmp',
    'temp',
]);
const MIN_HINT_TOKEN_LENGTH = 3;
const PROJECT_MATCH_LIMIT = 6;
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
function isExistingDirectory(candidate) {
    const normalized = normalizeDir(candidate);
    if (!normalized || !fs.existsSync(normalized)) {
        return false;
    }
    try {
        return fs.statSync(normalized).isDirectory();
    }
    catch {
        return false;
    }
}
function isExistingFile(candidate) {
    const normalized = normalizeDir(candidate);
    if (!normalized || !fs.existsSync(normalized)) {
        return false;
    }
    try {
        return fs.statSync(normalized).isFile();
    }
    catch {
        return false;
    }
}
function pushUniqueDirectory(directories, candidate) {
    if (!isExistingDirectory(candidate)) {
        return;
    }
    const normalized = path.resolve(candidate);
    if (!directories.includes(normalized)) {
        directories.push(normalized);
    }
}
function sanitizeFileHint(pathOrName) {
    return pathOrName.trim().replace(/^['"]+|['"]+$/g, '');
}
function normalizeSearchKey(value) {
    return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}
function tokenizeSearchHint(value) {
    const withoutWildcards = value.replace(/[*?]/g, ' ');
    const baseName = path.parse(withoutWildcards).name || withoutWildcards;
    const withCamelSpacing = baseName.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
    const tokens = withCamelSpacing
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .map(token => token.trim())
        .filter(token => token.length >= MIN_HINT_TOKEN_LENGTH);
    return [...new Set(tokens)];
}
function scoreProjectDirectoryName(directoryName, normalizedHint, hintTokens) {
    const normalizedDirectoryName = normalizeSearchKey(directoryName);
    if (!normalizedDirectoryName) {
        return 0;
    }
    if (normalizedHint.length >= 4 && normalizedDirectoryName.includes(normalizedHint)) {
        return 1;
    }
    if (hintTokens.length === 0) {
        return 0;
    }
    const tokenMatches = hintTokens.filter(token => normalizedDirectoryName.includes(token)).length;
    if (tokenMatches === 0) {
        return 0;
    }
    return tokenMatches / hintTokens.length;
}
function findProjectLikeDirectories(baseDir, projectHint) {
    if (!isExistingDirectory(baseDir)) {
        return [];
    }
    const normalizedHintSource = path.parse(projectHint.replace(/[*?]/g, '')).name || projectHint;
    const normalizedHint = normalizeSearchKey(normalizedHintSource);
    const hintTokens = tokenizeSearchHint(projectHint);
    if (!normalizedHint && hintTokens.length === 0) {
        return [];
    }
    let entries;
    try {
        entries = fs.readdirSync(baseDir, { withFileTypes: true });
    }
    catch {
        return [];
    }
    const scored = [];
    for (const entry of entries) {
        if (!entry.isDirectory()) {
            continue;
        }
        if (entry.name.startsWith('.')) {
            continue;
        }
        const lowerName = entry.name.toLowerCase();
        if (lowerName === 'lib' || NOISY_PROJECT_DIRECTORIES.has(lowerName)) {
            continue;
        }
        const score = scoreProjectDirectoryName(entry.name, normalizedHint, hintTokens);
        if (score < 0.5) {
            continue;
        }
        scored.push({
            dir: path.join(baseDir, entry.name),
            score,
        });
    }
    scored.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        if (a.dir.length !== b.dir.length) {
            return a.dir.length - b.dir.length;
        }
        return a.dir.localeCompare(b.dir);
    });
    return scored.slice(0, PROJECT_MATCH_LIMIT).map(match => match.dir);
}
function getPrimaryScriptDirectories(overrideScriptDir) {
    const cfg = loadConfig();
    const envDir = process.env.AHK_MCP_SCRIPT_DIR;
    const activeFile = getActiveFile();
    const activeDir = activeFile ? path.dirname(activeFile) : undefined;
    const directories = [];
    pushUniqueDirectory(directories, overrideScriptDir);
    pushUniqueDirectory(directories, cfg.scriptDir);
    pushUniqueDirectory(directories, envDir);
    pushUniqueDirectory(directories, activeDir);
    if (directories.length === 0) {
        pushUniqueDirectory(directories, process.cwd());
    }
    return directories;
}
export function getPrioritizedFileSearchDirs(options = {}) {
    const cfg = loadConfig();
    const prioritized = [];
    const primaryDirs = getPrimaryScriptDirectories(options.scriptDir);
    // Priority 1: script directories
    primaryDirs.forEach(dir => pushUniqueDirectory(prioritized, dir));
    // Priority 2: Lib folders for each script directory
    primaryDirs.forEach(dir => pushUniqueDirectory(prioritized, path.join(dir, 'Lib')));
    // Priority 3: directories with names similar to the target project/script hint
    if (options.projectHint && options.projectHint.trim().length > 0) {
        const projectSearchBases = [];
        primaryDirs.forEach(dir => {
            pushUniqueDirectory(projectSearchBases, dir);
            pushUniqueDirectory(projectSearchBases, path.dirname(dir));
        });
        pushUniqueDirectory(projectSearchBases, process.cwd());
        for (const base of projectSearchBases) {
            const candidates = findProjectLikeDirectories(base, options.projectHint);
            candidates.forEach(dir => pushUniqueDirectory(prioritized, dir));
            candidates.forEach(dir => pushUniqueDirectory(prioritized, path.join(dir, 'Lib')));
        }
    }
    // Final fallback: explicitly configured extra directories
    (options.extraDirs || []).forEach(dir => pushUniqueDirectory(prioritized, dir));
    (cfg.searchDirs || []).forEach(dir => pushUniqueDirectory(prioritized, dir));
    pushUniqueDirectory(prioritized, process.cwd());
    return prioritized;
}
function buildPathCandidates(pathOrName) {
    const candidates = [pathOrName];
    const hasExtension = path.extname(pathOrName).length > 0;
    if (!hasExtension && !pathOrName.endsWith(path.sep)) {
        candidates.push(`${pathOrName}.ahk`);
    }
    return [...new Set(candidates)];
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
 * Get the configured AutoHotkey executable path, if set
 */
export function getAhkPath() {
    return loadConfig().ahkPath;
}
/**
 * Get the configured VS Code workspace folder, if set
 */
export function getVscodeWorkspace() {
    return loadConfig().vscodeWorkspace;
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
    const requested = sanitizeFileHint(pathOrName);
    if (!requested) {
        return undefined;
    }
    // If it's already an absolute path that exists, return it immediately.
    if (path.isAbsolute(requested) && isExistingFile(requested)) {
        return path.resolve(requested);
    }
    const candidatePaths = buildPathCandidates(requested);
    const searchDirs = getPrioritizedFileSearchDirs({ projectHint: requested });
    for (const dir of searchDirs) {
        for (const candidate of candidatePaths) {
            const fullPath = path.resolve(dir, candidate);
            if (isExistingFile(fullPath)) {
                return fullPath;
            }
        }
    }
    return undefined;
}
