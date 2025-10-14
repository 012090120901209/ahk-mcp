/**
 * Test script to verify actual AHK MCP tool functionality
 * Tests the real AHK_File_Edit tool with create action and path conversion
 */

const { spawn } = require('child_process');
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

// Helper function to call MCP server
async function callMcpTool(toolName, args) {
  return new Promise((resolve, reject) => {
    const mcpServer = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    let stdout = '';
    let stderr = '';

    mcpServer.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    mcpServer.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    mcpServer.on('close', (code) => {
      if (code === 0) {
        try {
          const response = JSON.parse(stdout);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse MCP response: ${error.message}`));
        }
      } else {
        reject(new Error(`MCP server exited with code ${code}: ${stderr}`));
      }
    });

    mcpServer.on('error', (error) => {
      reject(error);
    });

    // Send the request
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };

    mcpServer.stdin.write(JSON.stringify(request) + '\n');
    mcpServer.stdin.end();
  });
}

// Test 1: Build the project first
async function testProjectBuild() {
  console.log('\n=== Test 0: Project Build ===');
  
  return new Promise((resolve) => {
    const buildProcess = spawn('npm', ['run', 'build'], {
      stdio: 'pipe',
      cwd: process.cwd()
    });

    let stdout = '';
    let stderr = '';

    buildProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    buildProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    buildProcess.on('close', (code) => {
      const success = code === 0;
      logTest('Project build', success, success ? 'Build successful' : `Build failed: ${stderr}`);
      resolve(success);
    });

    buildProcess.on('error', (error) => {
      logTest('Project build', false, error.message);
      resolve(false);
    });
  });
}

// Test 2: Test path conversion utilities directly
async function testPathConversionDirectly() {
  console.log('\n=== Test 1: Direct Path Conversion ===');
  
  try {
    // Import the path converter directly
    const { PathConverter, PathFormat } = await import('./dist/utils/path-converter.js');
    const converter = new PathConverter();
    
    // Test Windows to WSL
    const windowsPath = 'C:\\Users\\test\\script.ahk';
    const wslResult = converter.windowsToWSL(windowsPath);
    logTest('Windows to WSL conversion', wslResult.success, 
            wslResult.success ? `Converted to: ${wslResult.convertedPath}` : wslResult.error);
    
    // Test WSL to Windows
    const wslPath = '/mnt/c/users/test/script.ahk';
    const windowsResult = converter.wslToWindows(wslPath);
    logTest('WSL to Windows conversion', windowsResult.success,
            windowsResult.success ? `Converted to: ${windowsResult.convertedPath}` : windowsResult.error);
    
    // Test format detection
    const format = converter.detectPathFormat(windowsPath);
    logTest('Path format detection', format === PathFormat.WINDOWS,
            `Detected format: ${format}`);
    
    return true;
  } catch (error) {
    logTest('Direct path conversion', false, error.message);
    return false;
  }
}

// Test 3: Test file creation with simulated MCP call
async function testFileCreationSimulated() {
  console.log('\n=== Test 2: Simulated File Creation ===');
  
  const testFile = 'C:\\temp\\test-simulated.ahk';
  const testContent = '; Test simulated creation\nMsgBox("Hello from simulated test!")';
  
  try {
    // Import the AHK edit tool directly
    const { AhkEditTool } = await import('./dist/tools/ahk-file-edit.js');
    const editTool = new AhkEditTool();
    
    const result = await editTool.execute({
      action: 'create',
      filePath: testFile,
      content: testContent
    });
    
    const fileExists = fs.existsSync(testFile);
    const fileContent = fileExists ? fs.readFileSync(testFile, 'utf-8') : '';
    
    logTest('Simulated file creation', fileExists && fileContent === testContent,
            fileExists ? 'File created successfully via direct tool call' : 'File creation failed');
    
    // Cleanup
    if (fileExists) {
      fs.unlinkSync(testFile);
    }
    
    return fileExists;
  } catch (error) {
    logTest('Simulated file creation', false, error.message);
    return false;
  }
}

// Test 4: Test path interceptor
async function testPathInterceptor() {
  console.log('\n=== Test 3: Path Interceptor ===');
  
  try {
    // Import the path interceptor directly
    const { pathInterceptor } = await import('./dist/core/path-interceptor.js');
    
    // Test input interception
    const testArgs = {
      filePath: '/mnt/c/temp/test.ahk',
      content: '; Test path interception'
    };
    
    const result = pathInterceptor.interceptInput('AHK_File_Edit', testArgs);
    
    const success = result.success && result.modifiedData.filePath.includes('C:');
    logTest('Path input interception', success,
            success ? `Path converted from ${testArgs.filePath} to ${result.modifiedData.filePath}` : result.error);
    
    return success;
  } catch (error) {
    logTest('Path interceptor', false, error.message);
    return false;
  }
}

// Test 5: Test edge cases with real implementation
async function testEdgeCasesReal() {
  console.log('\n=== Test 4: Edge Cases with Real Implementation ===');
  
  try {
    const { AhkEditTool } = await import('./dist/tools/ahk-file-edit.js');
    const editTool = new AhkEditTool();
    
    // Test with relative path
    const relativePath = './test-relative.ahk';
    const result1 = await editTool.execute({
      action: 'create',
      filePath: relativePath,
      content: '; Test relative path'
    });
    
    const relativeExists = fs.existsSync(relativePath);
    logTest('Relative path handling', relativeExists,
            relativeExists ? 'Relative path handled correctly' : 'Relative path failed');
    
    // Cleanup
    if (relativeExists) {
      fs.unlinkSync(relativePath);
    }
    
    // Test with special characters
    const specialPath = 'C:\\temp\\test with spaces.ahk';
    const result2 = await editTool.execute({
      action: 'create',
      filePath: specialPath,
      content: '; Test special characters'
    });
    
    const specialExists = fs.existsSync(specialPath);
    logTest('Special characters in path', specialExists,
            specialExists ? 'Special characters handled correctly' : 'Special characters failed');
    
    // Cleanup
    if (specialExists) {
      fs.unlinkSync(specialPath);
    }
    
    return relativeExists || specialExists;
  } catch (error) {
    logTest('Edge cases real', false, error.message);
    return false;
  }
}

// Test 6: Test error handling
async function testErrorHandling() {
  console.log('\n=== Test 5: Error Handling ===');
  
  try {
    const { AhkEditTool } = await import('./dist/tools/ahk-file-edit.js');
    const editTool = new AhkEditTool();
    
    // Test invalid extension
    let errorCaught = false;
    try {
      await editTool.execute({
        action: 'create',
        filePath: 'C:\\temp\\test.txt',
        content: '; Invalid extension'
      });
    } catch (error) {
      if (error.message.includes('.ahk')) {
        errorCaught = true;
      }
    }
    
    logTest('Invalid extension error', errorCaught,
            errorCaught ? 'Correctly rejected invalid extension' : 'Failed to catch invalid extension');
    
    // Test missing content
    errorCaught = false;
    try {
      await editTool.execute({
        action: 'create',
        filePath: 'C:\\temp\\test.ahk'
        // Missing content
      });
    } catch (error) {
      if (error.message.includes('Content is required')) {
        errorCaught = true;
      }
    }
    
    logTest('Missing content error', errorCaught,
            errorCaught ? 'Correctly required content parameter' : 'Failed to require content');
    
    return true;
  } catch (error) {
    logTest('Error handling', false, error.message);
    return false;
  }
}

// Main test runner
async function runRealTests() {
  console.log('🧪 Starting Real AHK Tools Tests\n');
  
  try {
    // Build the project first
    const buildSuccess = await testProjectBuild();
    if (!buildSuccess) {
      console.log('❌ Build failed, skipping remaining tests');
      return TEST_RESULTS;
    }
    
    // Run all tests
    await testPathConversionDirectly();
    await testFileCreationSimulated();
    await testPathInterceptor();
    await testEdgeCasesReal();
    await testErrorHandling();
    
  } catch (error) {
    console.error('Test suite error:', error);
  }
  
  // Print final results
  console.log('\n' + '='.repeat(50));
  console.log('📊 REAL TOOLS TEST RESULTS SUMMARY');
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
  
  console.log('\n🏁 Real tools test suite completed!');
  return TEST_RESULTS;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runRealTests().catch(console.error);
}

module.exports = { runRealTests, TEST_RESULTS };