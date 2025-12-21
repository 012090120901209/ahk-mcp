import logger from '../logger.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
// Global data storage - loaded lazily
let ahkIndex = null;
let ahkDocumentationFull = null;
function resolveDataPath(rel) {
    // Resolve relative to this module at runtime (works in dist and src builds)
    const moduleDir = path.dirname(fileURLToPath(import.meta.url));
    return path.resolve(moduleDir, '..', '..', 'data', rel);
}
async function dynamicJsonImport(relPathFromData) {
    const relFromCore = `../../data/${relPathFromData}`;
    // Prefer import attributes when available (Node >= 20)
    try {
        const mod = await import(relFromCore, { with: { type: 'json' } });
        // Some bundlers put value on .default
        return mod.default ?? mod;
    }
    catch (err) {
        // Fallback to filesystem read for older Node versions
        try {
            const abs = resolveDataPath(relPathFromData);
            const text = fs.readFileSync(abs, 'utf8');
            return JSON.parse(text);
        }
        catch (fsErr) {
            logger.error('Failed to load JSON data:', relPathFromData, fsErr);
            throw fsErr;
        }
    }
}
/**
 * Load all AutoHotkey documentation data from direct imports
 */
export async function loadAhkData() {
    try {
        const mode = (process.env.AHK_MCP_DATA_MODE || '').toLowerCase();
        const lightMode = mode === 'light' || process.env.AHK_MCP_LIGHT === '1';
        // Use stderr to avoid polluting MCP stdout channel
        process.stderr.write(`[INFO] Loading AutoHotkey documentation data (mode=${lightMode ? 'light' : 'full'})...\n`);
        // Always load the lightweight index first
        ahkIndex = (await dynamicJsonImport('ahk_index.json'));
        if (!lightMode) {
            // Load additional documentation datasets
            ahkDocumentationFull = await dynamicJsonImport('ahk_documentation_full.json');
        }
        else {
            ahkDocumentationFull = null;
        }
    }
    catch (err) {
        logger.error('Failed to load AutoHotkey documentation data:', err);
        ahkIndex = null;
        ahkDocumentationFull = null;
        throw err;
    }
}
/**
 * Get the loaded AHK index
 */
export function getAhkIndex() {
    return ahkIndex;
}
/**
 * Get the full documentation
 */
export function getAhkDocumentationFull() {
    return ahkDocumentationFull;
}
/**
 * Search for functions by name or keyword
 */
export function searchFunctions(query) {
    if (!ahkIndex)
        return [];
    const normalizedQuery = query.toLowerCase();
    return ahkIndex.functions.filter(func => func.Name.toLowerCase().includes(normalizedQuery) ||
        func.Description.toLowerCase().includes(normalizedQuery));
}
/**
 * Search for classes by name or keyword
 */
export function searchClasses(query) {
    if (!ahkIndex)
        return [];
    const normalizedQuery = query.toLowerCase();
    return ahkIndex.classes.filter(cls => cls.Name.toLowerCase().includes(normalizedQuery) ||
        cls.Description.toLowerCase().includes(normalizedQuery));
}
/**
 * Search for variables by name or keyword
 */
export function searchVariables(query) {
    if (!ahkIndex)
        return [];
    const normalizedQuery = query.toLowerCase();
    return ahkIndex.variables.filter(variable => variable.Name.toLowerCase().includes(normalizedQuery) ||
        variable.Description.toLowerCase().includes(normalizedQuery));
}
// Removed unused: getFunctionByName, getClassByName, getMethodByName
/**
 * Initialize data loading
 */
export async function initializeDataLoader() {
    await loadAhkData();
}
