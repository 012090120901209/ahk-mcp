#!/usr/bin/env node
/**
 * PostToolUse hook: validate UIA selectors written into .ahk files against the live UI.
 *
 * Wire it up in .claude/settings.json:
 *
 *   {
 *     "matcher": "mcp__ahk__AHK_File_(Edit|Create).*",
 *     "hooks": [{ "type": "command",
 *                 "command": "node \"$CLAUDE_PROJECT_DIR/scripts/validate-uia-selectors.mjs\"",
 *                 "timeout": 60 }]
 *   }
 *
 * Mode comes from `uiaSelectorValidation` in the ahk-mcp settings file, or the
 * UIA_SELECTOR_VALIDATION env var: off | warn | fail. Default warn.
 *
 * Exit codes follow the PostToolUse contract: 2 blocks and feeds stderr back to the
 * model, anything else is advisory. Only mode=fail with a genuinely unresolved selector
 * ever returns 2 - a closed target app is reported, never blocking.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const projectDir = process.env.CLAUDE_PROJECT_DIR
  ? process.env.CLAUDE_PROJECT_DIR
  : path.dirname(path.dirname(fileURLToPath(import.meta.url)));

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

function resolveMode(settingsMode) {
  const env = (process.env.UIA_SELECTOR_VALIDATION || '').toLowerCase();
  if (env === 'off' || env === 'warn' || env === 'fail') return env;
  if (settingsMode === 'off' || settingsMode === 'warn' || settingsMode === 'fail')
    return settingsMode;
  return 'warn';
}

function loadSettingsMode() {
  const candidates = [
    path.join(process.env.USERPROFILE || process.env.HOME || '', '.ahk-mcp', 'tool-settings.json'),
    path.join(projectDir, '.ahk-mcp', 'tool-settings.json'),
  ];
  for (const file of candidates) {
    try {
      if (fs.existsSync(file)) {
        return JSON.parse(fs.readFileSync(file, 'utf8')).uiaSelectorValidation;
      }
    } catch {
      // A malformed settings file must not break editing; fall through to the default.
    }
  }
  return undefined;
}

/** The edited path can arrive under several keys depending on which edit tool ran. */
function extractFilePath(payload) {
  const input = payload?.tool_input ?? {};
  for (const key of ['filePath', 'file_path', 'targetFile', 'path', 'scriptPath']) {
    if (typeof input[key] === 'string' && input[key]) return input[key];
  }
  return undefined;
}

async function main() {
  let payload;
  try {
    payload = JSON.parse(await readStdin());
  } catch {
    process.exit(0);
  }

  const filePath = extractFilePath(payload);
  if (!filePath || !filePath.toLowerCase().endsWith('.ahk') || !fs.existsSync(filePath)) {
    process.exit(0);
  }

  const mode = resolveMode(loadSettingsMode());
  if (mode === 'off') process.exit(0);

  let validator;
  try {
    validator = await import(path.join(projectDir, 'dist', 'core', 'uia-selector-validator.js'));
  } catch {
    console.error(
      '[uia] validator unavailable — run `npm run build` to enable selector validation.'
    );
    process.exit(0);
  }

  let report;
  try {
    report = await validator.validateFile(filePath, mode);
  } catch (err) {
    console.error(`[uia] selector validation errored: ${err?.message ?? err}`);
    process.exit(0);
  }

  const text = validator.formatReport(report);
  if (text) console.error(text);
  process.exit(validator.exitCodeFor(report));
}

main().catch(() => process.exit(0));
