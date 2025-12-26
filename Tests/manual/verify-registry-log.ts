import { ToolRegistry } from '../../src/core/tool-registry.js';
import { friendlyLogger, LogCategory } from '../../src/core/friendly-logger.js';
import fs from 'fs';
import path from 'path';
import assert from 'assert';

const logFile = path.join(process.cwd(), 'logs', 'activity.log');

// Clear existing log
if (fs.existsSync(logFile)) {
  fs.unlinkSync(logFile);
}

console.log('Testing ToolRegistry Integration...');

// Mock Server
const mockServer = {
  ahkEditToolInstance: {
    execute: async (args: any) => {
      return { success: true, message: 'Edited' };
    },
  },
};

// Instantiate Registry
// We need to cast mockServer to any because we're not implementing the full interface
const registry = new ToolRegistry(mockServer as any);

// Execute a tool that should trigger logging
// AHK_File_Edit is mapped to 'ahkEditToolInstance' in ToolRegistry
try {
  await registry.executeTool('AHK_File_Edit', { filePath: 'test.ahk', content: 'foo' });
} catch (e) {
  console.error('Tool execution failed:', e);
}

// Verify file content
if (!fs.existsSync(logFile)) {
  console.error('❌ Log file not created');
  process.exit(1);
}

const content = fs.readFileSync(logFile, 'utf8');
console.log('Log Content:\n', content);

// Check for the specific log entry
// ToolRegistry maps 'AHK_File_Edit' to LogCategory.EDIT
assert(content.includes('✏️  AHK_File_Edit completed (File: test.ahk)'));

console.log('🎉 ToolRegistry integration verification passed!');
