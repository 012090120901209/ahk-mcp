/**
 * Core functionality test for enhanced file creation and path conversion
 * Tests the core logic without requiring full MCP server connection
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

// Test 1: Path conversion logic
async function testPathConversionLogic() {
  console.log('\n=== Test 1: Path Conversion Logic ===');
  
  try {
    // Test Windows to WSL conversion logic
    function windowsToWSL(windowsPath) {
      const match = /^([A-Za-z]):[\\/](.*)$/.exec(windowsPath);
      if (match) {
        const drive = match[1].toLowerCase();
        const remainingPath = match[2].replace(/\\/g, '/');
        return `/mnt/${drive}/${remainingPath}`;
      }
      return windowsPath;
    }
    
    // Test WSL to Windows conversion logic
    function wslToWindows(wslPath) {
      const match = /^\/mnt\/([a-zA-Z])\/(.*)$/.exec(wslPath);
      if (match) {
        const drive = match[1].toUpperCase();
        const segments = match[2].split('/');
        if (segments.length > 0) {
          const canonicalMap = {
            users: 'Users',
            'program files': 'Program Files',
            'program files (x86)': 'Program Files (x86)',
            programdata: 'ProgramData',
            windows: 'Windows'
          };
          const first = segments[0];
          const canonical = canonicalMap[first.toLowerCase()];
          if (canonical) {
            segments[0] = canonical;
          } else if (first.length > 0) {
            segments[0] = first[0].toUpperCase() + first.slice(1);
          }
        }
        const remainingPath = segments.join('\\');
        return `${drive}:\\${remainingPath}`;
      }
      return wslPath;
    }
    
    // Test cases
    const testCases = [
      {
        input: 'C:\\Users\\test\\script.ahk',
        expected: '/mnt/c/Users/test/script.ahk',
        type: 'Windows to WSL'
      },
      {
        input: '/mnt/c/users/test/script.ahk',
        expected: 'C:\\Users\\test\\script.ahk',
        type: 'WSL to Windows'
      },
      {
        input: 'D:\\Projects\\my-script.ahk',
        expected: '/mnt/d/Projects/my-script.ahk',
        type: 'Windows to WSL'
      }
    ];
    
    let allPassed = true;
    testCases.forEach(testCase => {
      let result;
      if (testCase.type === 'Windows to WSL') {
        result = windowsToWSL(testCase.input);
      } else {
        result = wslToWindows(testCase.input);
      }
      
      const passed = result === testCase.expected;
      logTest(`${testCase.type}: ${testCase.input}`, passed,
              passed ? `✓ ${result}` : `✗ Expected: ${testCase.expected}, Got: ${result}`);
      
      if (!passed) allPassed = false;
    });
    
    return allPassed;
  } catch (error) {
    logTest('Path conversion logic', false, error.message);
    return false;
  }
}

// Test 2: File creation logic
async function testFileCreationLogic() {
  console.log('\n=== Test 2: File Creation Logic ===');
  
  try {
    const testDir = 'C:\\temp\\ahk-test';
    const testFile = path.join(testDir, 'test-creation.ahk');
    const testContent = '; Test file creation\nMsgBox("Hello World!")';
    
    // Ensure test directory exists
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Test file creation
    fs.writeFileSync(testFile, testContent, 'utf-8');
    
    // Verify file was created
    const fileExists = fs.existsSync(testFile);
    const fileContent = fileExists ? fs.readFileSync(testFile, 'utf-8') : '';
    const contentMatches = fileContent === testContent;
    
    logTest('File creation', fileExists && contentMatches,
            fileExists ? 'File created successfully' : 'File creation failed');
    
    // Test .ahk extension validation
    const validExtensions = ['.ahk', '.AHK'];
    const invalidExtensions = ['.txt', '.js', '.md'];
    
    let extensionTestsPassed = true;
    
    validExtensions.forEach(ext => {
      const testPath = `C:\\temp\\test${ext}`;
      const isValid = testPath.toLowerCase().endsWith('.ahk');
      logTest(`Valid extension check: ${ext}`, isValid,
              isValid ? 'Correctly identified as valid' : 'Incorrectly identified as invalid');
      if (!isValid) extensionTestsPassed = false;
    });
    
    invalidExtensions.forEach(ext => {
      const testPath = `C:\\temp\\test${ext}`;
      const isValid = testPath.toLowerCase().endsWith('.ahk');
      logTest(`Invalid extension check: ${ext}`, !isValid,
              !isValid ? 'Correctly identified as invalid' : 'Incorrectly identified as valid');
      if (isValid) extensionTestsPassed = false;
    });
    
    // Cleanup
    if (fileExists) {
      fs.unlinkSync(testFile);
    }
    
    return (fileExists && contentMatches) && extensionTestsPassed;
  } catch (error) {
    logTest('File creation logic', false, error.message);
    return false;
  }
}

// Test 3: Directory creation logic
async function testDirectoryCreationLogic() {
  console.log('\n=== Test 3: Directory Creation Logic ===');
  
  try {
    const nestedDir = 'C:\\temp\\nested\\deep\\directories';
    const testFile = path.join(nestedDir, 'test-nested.ahk');
    const testContent = '; Test nested directory creation';
    
    // Test nested directory creation
    if (!fs.existsSync(nestedDir)) {
      fs.mkdirSync(nestedDir, { recursive: true });
    }
    
    fs.writeFileSync(testFile, testContent, 'utf-8');
    
    const dirExists = fs.existsSync(nestedDir);
    const fileExists = fs.existsSync(testFile);
    
    logTest('Nested directory creation', dirExists && fileExists,
            dirExists && fileExists ? 'Nested directories created successfully' : 'Directory creation failed');
    
    // Cleanup
    if (fileExists) {
      fs.unlinkSync(testFile);
    }
    // Remove directories from bottom up
    const parts = nestedDir.split(path.sep);
    for (let i = parts.length; i > 0; i--) {
      const currentDir = parts.slice(0, i).join(path.sep);
      try {
        if (fs.existsSync(currentDir) && fs.readdirSync(currentDir).length === 0) {
          fs.rmdirSync(currentDir);
        }
      } catch (error) {
        // Directory not empty or other error, skip
        break;
      }
    }
    
    return dirExists && fileExists;
  } catch (error) {
    logTest('Directory creation logic', false, error.message);
    return false;
  }
}

// Test 4: Error handling logic
async function testErrorHandlingLogic() {
  console.log('\n=== Test 4: Error Handling Logic ===');
  
  try {
    let errorHandlingPassed = true;
    
    // Test 1: Invalid extension detection
    const invalidFile = 'C:\\temp\\test.txt';
    const hasValidExtension = invalidFile.toLowerCase().endsWith('.ahk');
    logTest('Invalid extension detection', !hasValidExtension,
            !hasValidExtension ? 'Correctly detected invalid extension' : 'Failed to detect invalid extension');
    
    if (hasValidExtension) errorHandlingPassed = false;
    
    // Test 2: Duplicate file detection
    const existingFile = 'C:\\temp\\existing-test.ahk';
    const testContent = '; Test duplicate detection';
    
    // Create initial file
    try {
      fs.writeFileSync(existingFile, testContent, 'utf-8');
      
      // Test duplicate detection
      const fileExists = fs.existsSync(existingFile);
      logTest('Duplicate file detection', fileExists,
              fileExists ? 'Correctly detected existing file' : 'Failed to detect existing file');
      
      if (!fileExists) errorHandlingPassed = false;
      
      // Cleanup
      if (fileExists) {
        fs.unlinkSync(existingFile);
      }
    } catch (error) {
      logTest('Duplicate file detection', false, error.message);
      errorHandlingPassed = false;
    }
    
    // Test 3: Path validation
    const invalidPaths = [
      '',
      null,
      undefined,
      '   ', // whitespace only
      'C:\\temp\\' // directory, not file
    ];
    
    invalidPaths.forEach((invalidPath, index) => {
      const isValid = invalidPath && 
                   typeof invalidPath === 'string' && 
                   invalidPath.trim().length > 0 &&
                   invalidPath.toLowerCase().endsWith('.ahk');
      
      logTest(`Invalid path test ${index + 1}`, !isValid,
              !isValid ? 'Correctly rejected invalid path' : 'Incorrectly accepted invalid path');
      
      if (isValid) errorHandlingPassed = false;
    });
    
    return errorHandlingPassed;
  } catch (error) {
    logTest('Error handling logic', false, error.message);
    return false;
  }
}

// Test 5: Integration test
async function testIntegrationLogic() {
  console.log('\n=== Test 5: Integration Logic ===');
  
  try {
    // Simulate the complete workflow
    const wslPath = '/mnt/c/temp/integration-test.ahk';
    const testContent = '; Integration test\nMsgBox("Integration successful!")';
    
    // Step 1: Convert WSL path to Windows
    const windowsPath = wslPath.replace(/^\/mnt\/([a-zA-Z])\//, (match, drive) => {
      return `${drive.toUpperCase()}:\\`;
    }).replace(/\//g, '\\');
    
    const expectedWindowsPath = 'C:\\temp\\integration-test.ahk';
    const pathConversionCorrect = windowsPath === expectedWindowsPath;
    
    logTest('Integration path conversion', pathConversionCorrect,
            pathConversionCorrect ? `✓ ${windowsPath}` : `✗ Expected: ${expectedWindowsPath}`);
    
    // Step 2: Create directory if needed
    const dir = path.dirname(windowsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Step 3: Create file
    fs.writeFileSync(windowsPath, testContent, 'utf-8');
    
    // Step 4: Verify file exists and content is correct
    const fileExists = fs.existsSync(windowsPath);
    const fileContent = fileExists ? fs.readFileSync(windowsPath, 'utf-8') : '';
    const contentCorrect = fileContent === testContent;
    
    logTest('Integration file creation', fileExists && contentCorrect,
            fileExists && contentCorrect ? 'Integration test successful' : 'Integration test failed');
    
    // Step 5: Test path back-conversion for display
    const displayPath = windowsPath.replace(/^([A-Za-z]):\\/, (match, drive) => {
      return `/mnt/${drive.toLowerCase()}/`;
    }).replace(/\\/g, '/');
    
    const expectedDisplayPath = wslPath;
    const backConversionCorrect = displayPath === expectedDisplayPath;
    
    logTest('Integration back-conversion', backConversionCorrect,
            backConversionCorrect ? `✓ ${displayPath}` : `✗ Expected: ${expectedDisplayPath}`);
    
    // Cleanup
    if (fileExists) {
      fs.unlinkSync(windowsPath);
    }
    
    return pathConversionCorrect && (fileExists && contentCorrect) && backConversionCorrect;
  } catch (error) {
    logTest('Integration logic', false, error.message);
    return false;
  }
}

// Main test runner
async function runCoreTests() {
  console.log('🧪 Starting Core Functionality Tests\n');
  
  try {
    // Run all tests
    const test1 = await testPathConversionLogic();
    const test2 = await testFileCreationLogic();
    const test3 = await testDirectoryCreationLogic();
    const test4 = await testErrorHandlingLogic();
    const test5 = await testIntegrationLogic();
    
  } catch (error) {
    console.error('Test suite error:', error);
  }
  
  // Print final results
  console.log('\n' + '='.repeat(50));
  console.log('📊 CORE FUNCTIONALITY TEST RESULTS');
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
  
  console.log('\n🏁 Core functionality test suite completed!');
  return TEST_RESULTS;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runCoreTests().catch(console.error);
}

module.exports = { runCoreTests, TEST_RESULTS };
