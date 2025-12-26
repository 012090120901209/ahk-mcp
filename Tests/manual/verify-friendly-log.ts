import { friendlyLogger, LogCategory } from '../../src/core/friendly-logger.js';
import fs from 'fs';
import path from 'path';
import assert from 'assert';

const logFile = path.join(process.cwd(), 'logs', 'activity.log');

// Clear existing log
if (fs.existsSync(logFile)) {
  fs.unlinkSync(logFile);
}

console.log('Testing FriendlyLogger...');

// Log some events
friendlyLogger.log(LogCategory.INFO, 'Test Info', 'Details here');
friendlyLogger.success('Test Success', 'It worked!');
friendlyLogger.error('Test Error', 'Something broke');

// Verify file content
if (!fs.existsSync(logFile)) {
  console.error('❌ Log file not created');
  process.exit(1);
}

const content = fs.readFileSync(logFile, 'utf8');
console.log('Log Content:\n', content);

assert(content.includes('ℹ️  Test Info (Details here)'));
assert(content.includes('✅  Test Success (It worked!)'));
assert(content.includes('❌  Test Error (Something broke)'));

console.log('🎉 FriendlyLogger verification passed!');
