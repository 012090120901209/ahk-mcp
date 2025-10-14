/**
 * Comprehensive test suite for enhanced file creation capabilities
 * Tests the AHK_File_Edit tool with "create" action and path conversion system
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_RESULTS = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper function to log test results
function logTest(testName, passed, details = '') {
  TEST_RESULTS.total++;
  if (passed) {
    TEST_RESULTS.passed++;
    console.log(`✅ ${testName}`);
  } else {
    TEST_RESULTS.failed++;
    console.log(`❌ ${testName}`);
    if (details) console.log(`   Details: ${details}`);
  }
  
  TEST_RESULTS.details.push({
    test: testName,
    passed,
    details
  });
}

// Helper function to clean up test files
function cleanupTestFiles(testFiles) {
  testFiles.forEach(file => {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
      // Also clean up backup files
      if (fs.existsSync(file + '.bak')) {
        fs.unlinkSync(file + '.bak');
      }
    } catch (error) {
      console.warn(`Warning: Could not clean up ${file}: ${error.message}`);
    }
  });
}

const CREATE_TOOL = 'AHK_File_Create';

// Ensure a file (and optionally its directory) are removed before testing
function ensureCleanPath(targetFile, removeParent = false) {
  try {
    if (fs.existsSync(targetFile)) {
      fs.unlinkSync(targetFile);
    }
    if (removeParent) {
      const parentDir = path.dirname(targetFile);
      if (fs.existsSync(parentDir)) {
        fs.rmSync(parentDir, { recursive: true, force: true });
      }
    }
  } catch (error) {
    console.warn(`Warning: Failed to clean path ${targetFile}: ${error.message}`);
  }
}

// Test AHK_File_Create basic creation workflow
async function testCreateToolBasicFlow() {
  console.log('\n=== AHK_File_Create: Basic Creation ===');
  const testFile = 'C:\\temp\\create-tool-basic.ahk';
  const testContent = '; Basic create tool test\nMsgBox("AHK_File_Create basic")';
  ensureCleanPath(testFile);

  try {
    await useMcpTool(CREATE_TOOL, {
      filePath: testFile,
      content: testContent
    });

    const fileExists = fs.existsSync(testFile);
    const fileContent = fileExists ? fs.readFileSync(testFile, 'utf-8') : '';

    logTest('AHK_File_Create basic creation', fileExists && fileContent === testContent,
      fileExists ? 'File created successfully via AHK_File_Create' : 'File was not created');

    return testFile;
  } catch (error) {
    logTest('AHK_File_Create basic creation', false, error.message);
    return null;
  }
}

// Test dry-run support
async function testCreateToolDryRunSupport() {
  console.log('\n=== AHK_File_Create: Dry Run Support ===');
  const testFile = 'C:\\temp\\mcp-create\\dry-run\\create-tool-dry-run.ahk';
  ensureCleanPath(testFile, true);

  try {
    await useMcpTool(CREATE_TOOL, {
      filePath: testFile,
      content: '; Dry run test',
      dryRun: true
    });

    const fileExists = fs.existsSync(testFile);
    const directoryExists = fs.existsSync(path.dirname(testFile));

    const passed = !fileExists && !directoryExists;
    logTest('AHK_File_Create dry run', passed,
      passed ? 'Dry run prevented file and directory creation' : 'Dry run unexpectedly created files');

    return null;
  } catch (error) {
    logTest('AHK_File_Create dry run', false, error.message);
    return null;
  }
}

// Test overwrite handling
async function testCreateToolOverwriteFlow() {
  console.log('\n=== AHK_File_Create: Overwrite Handling ===');
  const testFile = 'C:\\temp\\create-tool-overwrite.ahk';
  const initialContent = '; Original content';
  const newContent = '; Overwritten content';
  ensureCleanPath(testFile);

  try {
    await useMcpTool(CREATE_TOOL, {
      filePath: testFile,
      content: initialContent
    });

    await useMcpTool(CREATE_TOOL, {
      filePath: testFile,
      content: newContent,
      overwrite: true
    });

    const fileExists = fs.existsSync(testFile);
    const fileContent = fileExists ? fs.readFileSync(testFile, 'utf-8') : '';

    logTest('AHK_File_Create overwrite', fileExists && fileContent === newContent,
      fileExists ? 'File overwritten successfully' : 'Overwrite operation failed');

    return testFile;
  } catch (error) {
    logTest('AHK_File_Create overwrite', false, error.message);
    return null;
  }
}

// Test WSL path conversion handling
async function testCreateToolWSLConversion() {
  console.log('\n=== AHK_File_Create: WSL Path Conversion ===');
  const wslPath = '/mnt/c/temp/create-tool-wsl.ahk';
  const expectedWindowsPath = 'C:\\temp\\create-tool-wsl.ahk';
  const content = '; WSL conversion test';
  ensureCleanPath(expectedWindowsPath);

  try {
    await useMcpTool(CREATE_TOOL, {
      filePath: wslPath,
      content
    });

    const fileExists = fs.existsSync(expectedWindowsPath);
    const fileContent = fileExists ? fs.readFileSync(expectedWindowsPath, 'utf-8') : '';

    logTest('AHK_File_Create WSL conversion', fileExists && fileContent === content,
      fileExists ? 'WSL path converted successfully' : 'WSL path conversion failed');

    return expectedWindowsPath;
  } catch (error) {
    logTest('AHK_File_Create WSL conversion', false, error.message);
    return null;
  }
}

// Test 1: Basic file creation with Windows path
async function testBasicFileCreation() {
  console.log('\n=== Test 1: Basic File Creation ===');
  const testFile = 'C:\\temp\\test-create-basic.ahk';
  const testContent = '; Test AutoHotkey script\nMsgBox("Hello World!")';
  
  try {
    // Test using AHK_File_Edit with create action
    const result = await useMcpTool('AHK_File_Edit', {
      action: 'create',
      filePath: testFile,
      content: testContent
    });
    
    // Verify file was created
    const fileExists = fs.existsSync(testFile);
    const fileContent = fileExists ? fs.readFileSync(testFile, 'utf-8') : '';
    
    logTest('Basic file creation', fileExists && fileContent === testContent, 
            fileExists ? 'File created successfully' : 'File not created');
    
    return testFile;
  } catch (error) {
    logTest('Basic file creation', false, error.message);
    return null;
  }
}

// Test 2: File creation with WSL path conversion
async function testWSLPathConversion() {
  console.log('\n=== Test 2: WSL Path Conversion ===');
  const wslPath = '/mnt/c/temp/test-create-wsl.ahk';
  const testContent = '; Test WSL path conversion\n#Requires AutoHotkey v2';
  
  try {
    const result = await useMcpTool('AHK_File_Edit', {
      action: 'create',
      filePath: wslPath,
      content: testContent
    });
    
    // Check if file was created at the expected Windows location
    const expectedWindowsPath = 'C:\\temp\\test-create-wsl.ahk';
    const fileExists = fs.existsSync(expectedWindowsPath);
    const fileContent = fileExists ? fs.readFileSync(expectedWindowsPath, 'utf-8') : '';
    
    logTest('WSL path conversion', fileExists && fileContent === testContent,
            fileExists ? 'WSL path converted and file created' : 'WSL path conversion failed');
    
    return expectedWindowsPath;
  } catch (error) {
    logTest('WSL path conversion', false, error.message);
    return null;
  }
}

// Test 3: Directory creation
async function testDirectoryCreation() {
  console.log('\n=== Test 3: Directory Creation ===');
  const testFile = 'C:\\temp\\nested\\deep\\test-create-dir.ahk';
  const testContent = '; Test directory creation\n; This should create nested directories';
  
  try {
    const result = await useMcpTool('AHK_File_Edit', {
      action: 'create',
      filePath: testFile,
      content: testContent
    });
    
    const fileExists = fs.existsSync(testFile);
    const dirExists = fs.existsSync(path.dirname(testFile));
    
    logTest('Directory creation', fileExists && dirExists,
            fileExists ? 'Nested directories created' : 'Directory creation failed');
    
    return testFile;
  } catch (error) {
    logTest('Directory creation', false, error.message);
    return null;
  }
}

// Test 4: .ahk extension validation
async function testExtensionValidation() {
  console.log('\n=== Test 4: Extension Validation ===');
  const invalidFile = 'C:\\temp\\test-invalid.txt';
  const validFile = 'C:\\temp\\test-valid.ahk';
  const testContent = '; Test extension validation';
  
  let invalidPassed = false;
  let validPassed = false;
  
  try {
    // Test invalid extension
    try {
      await useMcpTool('AHK_File_Edit', {
        action: 'create',
        filePath: invalidFile,
        content: testContent
      });
    } catch (error) {
      if (error.message.includes('.ahk')) {
        invalidPassed = true;
      }
    }
    
    // Test valid extension
    try {
      await useMcpTool('AHK_File_Edit', {
        action: 'create',
        filePath: validFile,
        content: testContent
      });
      validPassed = fs.existsSync(validFile);
    } catch (error) {
      // Should not fail for valid extension
    }
    
    logTest('Invalid extension rejection', invalidPassed,
            invalidPassed ? 'Correctly rejected non-.ahk file' : 'Failed to reject invalid extension');
    logTest('Valid extension acceptance', validPassed,
            validPassed ? 'Correctly accepted .ahk file' : 'Failed to accept valid extension');
    
    return [invalidFile, validFile];
  } catch (error) {
    logTest('Extension validation', false, error.message);
    return [invalidFile, validFile];
  }
}

// Test 5: Duplicate file handling
async function testDuplicateFileHandling() {
  console.log('\n=== Test 5: Duplicate File Handling ===');
  const testFile = 'C:\\temp\\test-duplicate.ahk';
  const testContent = '; Original content';
  const newContent = '; New content';
  
  try {
    // Create initial file
    await useMcpTool('AHK_File_Edit', {
      action: 'create',
      filePath: testFile,
      content: testContent
    });
    
    let duplicatePassed = false;
    
    // Try to create the same file again
    try {
      await useMcpTool('AHK_File_Edit', {
        action: 'create',
        filePath: testFile,
        content: newContent
      });
    } catch (error) {
      if (error.message.includes('already exists')) {
        duplicatePassed = true;
      }
    }
    
    logTest('Duplicate file rejection', duplicatePassed,
            duplicatePassed ? 'Correctly rejected duplicate file creation' : 'Failed to detect duplicate');
    
    return testFile;
  } catch (error) {
    logTest('Duplicate file handling', false, error.message);
    return null;
  }
}

// Test 6: Path conversion utilities
async function testPathConversionUtilities() {
  console.log('\n=== Test 6: Path Conversion Utilities ===');
  
  try {
    // Test Windows to WSL conversion
    const windowsPath = 'C:\\Users\\test\\script.ahk';
    const wslResult = await useMcpTool('PathConverter_WindowsToWSL', { path: windowsPath });
    
    // Test WSL to Windows conversion
    const wslPath = '/mnt/c/users/test/script.ahk';
    const windowsResult = await useMcpTool('PathConverter_WSLToWindows', { path: wslPath });
    
    // Test path format detection
    const formatResult = await useMcpTool('PathConverter_DetectFormat', { path: windowsPath });
    
    logTest('Windows to WSL conversion', wslResult && wslResult.success,
            wslResult ? `Converted to: ${wslResult.convertedPath}` : 'Conversion failed');
    
    logTest('WSL to Windows conversion', windowsResult && windowsResult.success,
            windowsResult ? `Converted to: ${windowsResult.convertedPath}` : 'Conversion failed');
    
    logTest('Path format detection', formatResult && formatResult.format,
            formatResult ? `Detected: ${formatResult.format}` : 'Detection failed');
    
    return true;
  } catch (error) {
    logTest('Path conversion utilities', false, error.message);
    return false;
  }
}

// Test 7: Integration with file viewing
async function testFileViewingIntegration() {
  console.log('\n=== Test 7: File Viewing Integration ===');
  const testFile = 'C:\\temp\\test-view-integration.ahk';
  const testContent = '; Test file viewing integration\nMsgBox("Integration Test")';
  
  try {
    // Create file
    await useMcpTool('AHK_File_Edit', {
      action: 'create',
      filePath: testFile,
      content: testContent
    });
    
    // Try to view the created file
    const viewResult = await useMcpTool('AHK_File_View', {
      file: testFile,
      mode: 'structured'
    });
    
    const viewSuccess = viewResult && viewResult.content && 
                       viewResult.content.some(item => item.text.includes(testContent));
    
    logTest('File viewing integration', viewSuccess,
            viewSuccess ? 'Created file can be viewed successfully' : 'File viewing failed');
    
    return testFile;
  } catch (error) {
    logTest('File viewing integration', false, error.message);
    return null;
  }
}

// Test 8: Edge cases
async function testEdgeCases() {
  console.log('\n=== Test 8: Edge Cases ===');
  
  // Test with special characters in path
  const specialCharPath = 'C:\\temp\\test with spaces\\test-special.ahk';
  const specialContent = '; Test special characters';
  
  // Test with different drive letters (fallback to current drive if unavailable)
  const rootDrive = process.platform === 'win32'
    ? (path.parse(process.cwd()).root || 'C:\\')
    : process.cwd();
  const differentDrivePath = path.join(rootDrive, 'temp', 'test-drive.ahk');
  const driveContent = '; Test different drive';
  
  // Test with very long path
  const longPath = 'C:\\temp\\' + 'very\\long\\nested\\path\\'.repeat(10) + 'test-long.ahk';
  const longContent = '; Test long path';
  
  const edgeCases = [
    { path: specialCharPath, content: specialContent, name: 'Special characters in path' },
    { path: differentDrivePath, content: driveContent, name: 'Alternate root path' },
    { path: longPath, content: longContent, name: 'Very long path' }
  ];
  
  const results = [];
  
  for (const testCase of edgeCases) {
    try {
      await useMcpTool('AHK_File_Edit', {
        action: 'create',
        filePath: testCase.path,
        content: testCase.content
      });
      
      const fileExists = fs.existsSync(testCase.path);
      logTest(testCase.name, fileExists, 
              fileExists ? 'Edge case handled successfully' : 'Edge case failed');
      
      results.push(testCase.path);
    } catch (error) {
      logTest(testCase.name, false, error.message);
      results.push(null);
    }
  }
  
  return results;
}

// Mock MCP tool usage function
async function useMcpTool(toolName, args) {
  // This would normally call the actual MCP tool
  // For testing purposes, we'll simulate the behavior
  
  if (toolName === 'AHK_File_Create') {
    const {
      filePath,
      content = '',
      overwrite = false,
      createDirectories = true,
      dryRun = false
    } = args;

    if (!filePath) {
      throw new Error('filePath is required');
    }

    let finalPath = filePath;
    if (filePath.startsWith('/mnt/')) {
      const match = /^\/mnt\/([a-zA-Z])\/(.*)$/.exec(filePath);
      if (match) {
        const drive = match[1].toUpperCase();
        const rest = match[2].replace(/\//g, '\\');
        finalPath = `${drive}:\\${rest}`;
      }
    }

    const resolvedPath = path.resolve(finalPath);

    if (!resolvedPath.toLowerCase().endsWith('.ahk')) {
      throw new Error('Target file must have a .ahk extension.');
    }

    const directoryPath = path.dirname(resolvedPath);
    const directoryExists = fs.existsSync(directoryPath);
    const fileExists = fs.existsSync(resolvedPath);

    if (fileExists && !overwrite) {
      throw new Error(`File already exists: ${resolvedPath}`);
    }

    if (!directoryExists && !createDirectories) {
      throw new Error(`Directory does not exist: ${directoryPath}`);
    }

    const directoriesWillBeCreated = !directoryExists && createDirectories;
    const bytesPlanned = Buffer.byteLength(content, 'utf8');

    if (!dryRun && directoriesWillBeCreated) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    if (!dryRun) {
      fs.writeFileSync(resolvedPath, content, 'utf-8');
    }

    return {
      content: [
        {
          type: 'text',
          text: dryRun
            ? '🔬 Dry run: AutoHotkey file creation preview.'
            : '✅ AutoHotkey file created successfully.'
        },
        {
          type: 'text',
          text: JSON.stringify({
            filePath: resolvedPath,
            dryRun,
            overwrite,
            fileExistedBefore: fileExists,
            directoriesWillBeCreated,
            directoriesCreated: !dryRun && directoriesWillBeCreated,
            bytesPlanned,
            bytesWritten: dryRun ? 0 : bytesPlanned,
            message: dryRun
              ? 'Dry run complete. No changes were written to disk.'
              : fileExists && overwrite
                ? 'Existing file overwritten with new content.'
                : 'New AutoHotkey file created successfully.'
          }, null, 2)
        }
      ]
    };
  }

  if (toolName === 'AHK_File_Edit') {
    const { action, filePath, content } = args;
    
    // Simulate path conversion
    let finalPath = filePath;
    if (filePath.startsWith('/mnt/')) {
      // Convert WSL path to Windows
      const match = /^\/mnt\/([a-zA-Z])\/(.*)$/.exec(filePath);
      if (match) {
        const drive = match[1].toUpperCase();
        const rest = match[2].replace(/\//g, '\\');
        finalPath = `${drive}:\\${rest}`;
      }
    }
    
    // Validate .ahk extension
    if (!finalPath.toLowerCase().endsWith('.ahk')) {
      throw new Error('Can only edit .ahk files');
    }
    
    // Check if file exists for create action
    if (action === 'create' && fs.existsSync(finalPath)) {
      throw new Error(`File already exists: ${finalPath}`);
    }
    
    // Create directory if needed
    const dir = path.dirname(finalPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write file
    fs.writeFileSync(finalPath, content, 'utf-8');
    
    return {
      content: [{
        type: 'text',
        text: `✅ **Edit Successful**\n\n📄 **File:** ${finalPath}\n⚙️ **Operation:** Created new file with content`
      }]
    };
  }
  
  if (toolName === 'AHK_File_View') {
    const { file, mode } = args;
    
    if (!fs.existsSync(file)) {
      throw new Error(`File not found: ${file}`);
    }
    
    const content = fs.readFileSync(file, 'utf-8');
    
    return {
      content: [{
        type: 'text',
        text: `📖 **File:** ${file}\n\n${content}`
      }]
    };
  }
  
  if (toolName.startsWith('PathConverter_')) {
    const { path: inputPath } = args;
    
    if (toolName === 'PathConverter_WindowsToWSL') {
      const match = /^([A-Za-z]):[\\/](.*)$/.exec(inputPath);
      if (match) {
        const drive = match[1].toLowerCase();
        const rest = match[2].replace(/\\/g, '/');
        return {
          success: true,
          originalPath: inputPath,
          convertedPath: `/mnt/${drive}/${rest}`
        };
      }
    }
    
    if (toolName === 'PathConverter_WSLToWindows') {
      const match = /^\/mnt\/([a-zA-Z])\/(.*)$/.exec(inputPath);
      if (match) {
        const drive = match[1].toUpperCase();
        const rest = match[2].replace(/\//g, '\\');
        return {
          success: true,
          originalPath: inputPath,
          convertedPath: `${drive}:\\${rest}`
        };
      }
    }
    
    if (toolName === 'PathConverter_DetectFormat') {
      if (/^[A-Za-z]:[\\/]/.test(inputPath)) {
        return { format: 'windows' };
      }
      if (/^\/mnt\/[a-zA-Z]\//.test(inputPath)) {
        return { format: 'wsl' };
      }
      return { format: 'unknown' };
    }
    
    return { success: false, error: 'Conversion failed' };
  }
  
  throw new Error(`Unknown tool: ${toolName}`);
}

// Main test runner
async function runAllTests() {
  console.log('🧪 Starting Enhanced File Creation Tests\n');
  
  const testFiles = [];
  
  try {
    const createBasic = await testCreateToolBasicFlow();
    if (createBasic) testFiles.push(createBasic);
    
    await testCreateToolDryRunSupport();
    
    const createOverwrite = await testCreateToolOverwriteFlow();
    if (createOverwrite) testFiles.push(createOverwrite);
    
    const createWsl = await testCreateToolWSLConversion();
    if (createWsl) testFiles.push(createWsl);
    
    // Run all tests
    const test1 = await testBasicFileCreation();
    if (test1) testFiles.push(test1);
    
    const test2 = await testWSLPathConversion();
    if (test2) testFiles.push(test2);
    
    const test3 = await testDirectoryCreation();
    if (test3) testFiles.push(test3);
    
    const test4 = await testExtensionValidation();
    testFiles.push(...test4.filter(f => f));
    
    const test5 = await testDuplicateFileHandling();
    if (test5) testFiles.push(test5);
    
    await testPathConversionUtilities();
    
    const test7 = await testFileViewingIntegration();
    if (test7) testFiles.push(test7);
    
    const test8 = await testEdgeCases();
    testFiles.push(...test8.filter(f => f));
    
  } catch (error) {
    console.error('Test suite error:', error);
  }
  
  // Print final results
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${TEST_RESULTS.total}`);
  console.log(`Passed: ${TEST_RESULTS.passed} ✅`);
  console.log(`Failed: ${TEST_RESULTS.failed} ❌`);
  console.log(`Success Rate: ${((TEST_RESULTS.passed / TEST_RESULTS.total) * 100).toFixed(1)}%`);
  
  if (TEST_RESULTS.failed > 0) {
    console.log('\n❌ Failed Tests:');
    TEST_RESULTS.details
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`  - ${test.test}: ${test.details}`);
      });
  }
  
  // Cleanup
  console.log('\n🧹 Cleaning up test files...');
  cleanupTestFiles(testFiles);
  
  console.log('\n🏁 Test suite completed!');
  return TEST_RESULTS;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, TEST_RESULTS };
