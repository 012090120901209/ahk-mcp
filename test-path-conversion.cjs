// Simple test for path conversion system using CommonJS
const { PathConverter, PathFormat } = require('./dist/utils/path-converter.js');
const { PathInterceptor } = require('./dist/core/path-interceptor.js');
const { configManager } = require('./dist/core/path-converter-config.js');

console.log('Testing Path Conversion System...\n');

// Test 1: Basic Windows to WSL conversion
console.log('=== Test 1: Windows to WSL Conversion ===');
const converter = new PathConverter();

const windowsPath = 'C:\\Users\\test\\script.ahk';
const wslResult = converter.windowsToWSL(windowsPath);
console.log(`Windows: ${windowsPath}`);
console.log(`WSL: ${wslResult.convertedPath}`);
console.log(`Success: ${wslResult.success}`);
console.log(`Original Format: ${wslResult.originalFormat}`);
console.log(`Target Format: ${wslResult.targetFormat}\n`);

// Test 2: WSL to Windows conversion
console.log('=== Test 2: WSL to Windows Conversion ===');
const wslPath = '/mnt/c/users/test/script.ahk';
const windowsResult = converter.wslToWindows(wslPath);
console.log(`WSL: ${wslPath}`);
console.log(`Windows: ${windowsResult.convertedPath}`);
console.log(`Success: ${windowsResult.success}`);
console.log(`Original Format: ${windowsResult.originalFormat}`);
console.log(`Target Format: ${windowsResult.targetFormat}\n`);

// Test 3: Path format detection
console.log('=== Test 3: Path Format Detection ===');
const testPaths = [
  'C:\\Windows\\System32',
  '/mnt/c/Users/test',
  '/home/user/documents',
  '\\\\server\\share\\file'
];

testPaths.forEach(path => {
  const format = converter.detectPathFormat(path);
  console.log(`Path: ${path} -> Format: ${format}`);
});
console.log();

// Test 4: Path Interceptor
console.log('=== Test 4: Path Interceptor ===');
const interceptor = new PathInterceptor();

// Test tool arguments with paths
const toolArgs = {
  filePath: '/mnt/c/Users/test/script.ahk',
  content: 'MsgBox("Hello World")',
  action: 'create'
};

const interceptionResult = interceptor.interceptInput('AHK_File_Edit', toolArgs);
console.log(`Original filePath: ${toolArgs.filePath}`);
console.log(`Converted filePath: ${interceptionResult.modifiedData.filePath}`);
console.log(`Interception Success: ${interceptionResult.success}`);
console.log(`Conversions: ${interceptionResult.conversions.length}\n`);

// Test 5: Configuration Manager
console.log('=== Test 5: Configuration Manager ===');
try {
  const config = configManager.getConfig();
  console.log(`Path Conversion Enabled: ${config.enabled}`);
  console.log(`Default Target Format: ${config.defaultTargetFormat}`);
  console.log(`Drive Mappings: ${config.driveMappings.length}`);
  console.log(`Tool Configs: ${config.toolConfigs.length}`);
} catch (error) {
  console.log(`Config test failed: ${error.message}`);
}

console.log('\n=== Path Conversion System Test Complete ===');