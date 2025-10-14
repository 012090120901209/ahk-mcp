#!/usr/bin/env node

/**
 * Development Tools and Debugging Utilities
 * 
 * This script provides various development tools and debugging utilities
 * for the AutoHotkey v2 MCP Server project.
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const http = require('http');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step) {
  log(`\n🔧 ${step}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Development tools
const devTools = {
  // Start development server with hot reload
  startDevServer: () => {
    logStep('Starting Development Server');
    
    const serverProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' }
    });

    serverProcess.on('error', (error) => {
      logError(`Failed to start dev server: ${error.message}`);
    });

    serverProcess.on('close', (code) => {
      if (code !== 0) {
        logError(`Dev server exited with code ${code}`);
      } else {
        logSuccess('Dev server stopped');
      }
    });

    return serverProcess;
  },

  // Run tests in watch mode
  runTestsWatch: () => {
    logStep('Running Tests in Watch Mode');
    
    const testProcess = spawn('npm', ['run', 'test:watch'], {
      stdio: 'inherit'
    });

    testProcess.on('error', (error) => {
      logError(`Failed to start test watcher: ${error.message}`);
    });

    return testProcess;
  },

  // Build and analyze bundle
  analyzeBundle: () => {
    logStep('Analyzing Bundle Size');
    
    try {
      execSync('npm run build', { stdio: 'inherit' });
      execSync('npm run analyze:bundle', { stdio: 'inherit' });
      logSuccess('Bundle analysis complete');
    } catch (error) {
      logError(`Bundle analysis failed: ${error.message}`);
    }
  },

  // Check for circular dependencies
  checkCircularDeps: () => {
    logStep('Checking for Circular Dependencies');
    
    try {
      execSync('npm run check:circular', { stdio: 'inherit' });
      logSuccess('No circular dependencies found');
    } catch (error) {
      logWarning('Circular dependencies detected');
    }
  },

  // Check for unused dependencies
  checkUnusedDeps: () => {
    logStep('Checking for Unused Dependencies');
    
    try {
      execSync('npm run check:deps', { stdio: 'inherit' });
      logSuccess('No unused dependencies found');
    } catch (error) {
      logWarning('Unused dependencies detected');
    }
  },

  // Run comprehensive code quality checks
  runQualityChecks: () => {
    logStep('Running Code Quality Checks');
    
    const checks = [
      { name: 'TypeScript types', cmd: 'npm run check:types' },
      { name: 'ESLint', cmd: 'npm run lint' },
      { name: 'Prettier', cmd: 'npm run format:check' },
      { name: 'Circular dependencies', cmd: 'npm run check:circular' },
      { name: 'Unused dependencies', cmd: 'npm run check:deps' }
    ];

    let allPassed = true;

    checks.forEach(({ name, cmd }) => {
      try {
        logInfo(`Running ${name}...`);
        execSync(cmd, { stdio: 'pipe' });
        logSuccess(`${name} passed`);
      } catch (error) {
        logError(`${name} failed`);
        allPassed = false;
      }
    });

    if (allPassed) {
      logSuccess('All quality checks passed!');
    } else {
      logError('Some quality checks failed');
    }
  },

  // Generate development report
  generateDevReport: () => {
    logStep('Generating Development Report');
    
    const report = {
      timestamp: new Date().toISOString(),
      project: {
        name: 'AutoHotkey v2 MCP Server',
        version: require('../package.json').version
      },
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch
      },
      dependencies: {},
      devDependencies: {},
      testResults: {},
      codeMetrics: {}
    };

    try {
      // Get dependency info
      const packageJson = require('../package.json');
      report.dependencies = packageJson.dependencies;
      report.devDependencies = packageJson.devDependencies;

      // Get test results
      try {
        const testOutput = execSync('npm run test:coverage', { encoding: 'utf8' });
        report.testResults = { coverage: testOutput.includes('All files') };
      } catch (error) {
        report.testResults = { coverage: false, error: error.message };
      }

      // Get code metrics
      try {
        const srcFiles = execSync('find src -name "*.ts" | wc -l', { encoding: 'utf8' });
        const testFiles = execSync('find tests -name "*.ts" | wc -l', { encoding: 'utf8' });
        report.codeMetrics = {
          sourceFiles: parseInt(srcFiles.trim()),
          testFiles: parseInt(testFiles.trim())
        };
      } catch (error) {
        report.codeMetrics = { error: error.message };
      }

      // Write report
      const reportPath = path.join(__dirname, '../dev-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      logSuccess(`Development report generated: ${reportPath}`);
    } catch (error) {
      logError(`Failed to generate report: ${error.message}`);
    }
  },

  // Start debugging session
  startDebugSession: () => {
    logStep('Starting Debug Session');
    
    const debugProcess = spawn('node', ['--inspect', 'dist/index.js'], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' }
    });

    debugProcess.on('error', (error) => {
      logError(`Failed to start debug session: ${error.message}`);
    });

    logInfo('Debug server started on localhost:9229');
    logInfo('Connect using Chrome DevTools or your preferred debugger');
    
    return debugProcess;
  },

  // Monitor server health
  monitorHealth: () => {
    logStep('Monitoring Server Health');
    
    const checkHealth = async () => {
      try {
        const response = await fetch('http://localhost:3000/health');
        if (response.ok) {
          const health = await response.json();
          logSuccess(`Server healthy: ${JSON.stringify(health)}`);
        } else {
          logWarning(`Server responded with status: ${response.status}`);
        }
      } catch (error) {
        logError(`Server health check failed: ${error.message}`);
      }
    };

    // Check immediately and then every 30 seconds
    checkHealth();
    setInterval(checkHealth, 30000);
  },

  // Clean development artifacts
  cleanDevArtifacts: () => {
    logStep('Cleaning Development Artifacts');
    
    const artifacts = [
      'dist',
      'coverage',
      '.nyc_output',
      'dev-report.json',
      'bundle-analysis.json'
    ];

    artifacts.forEach(artifact => {
      const artifactPath = path.join(__dirname, '..', artifact);
      if (fs.existsSync(artifactPath)) {
        try {
          if (fs.statSync(artifactPath).isDirectory()) {
            fs.rmSync(artifactPath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(artifactPath);
          }
          logSuccess(`Cleaned ${artifact}`);
        } catch (error) {
          logWarning(`Failed to clean ${artifact}: ${error.message}`);
        }
      }
    });

    logSuccess('Development artifacts cleaned');
  },

  // Setup development environment
  setupDevEnv: () => {
    logStep('Setting Up Development Environment');
    
    try {
      // Run the setup script
      execSync('node scripts/setup-dev.js', { stdio: 'inherit' });
      logSuccess('Development environment setup complete');
    } catch (error) {
      logError(`Setup failed: ${error.message}`);
    }
  }
};

// Interactive menu
function showMenu() {
  log('\n🛠️  AutoHotkey v2 MCP Server - Development Tools', 'bright');
  log('================================================', 'bright');
  log('\nAvailable tools:');
  log('1. Start development server');
  log('2. Run tests in watch mode');
  log('3. Analyze bundle size');
  log('4. Check circular dependencies');
  log('5. Check unused dependencies');
  log('6. Run code quality checks');
  log('7. Generate development report');
  log('8. Start debug session');
  log('9. Monitor server health');
  log('10. Clean development artifacts');
  log('11. Setup development environment');
  log('12. Exit');
  log('\nSelect a tool (1-12):', 'cyan');
}

async function main() {
  const args = process.argv.slice(2);
  
  // Handle command line arguments
  if (args.length > 0) {
    const tool = args[0];
    
    switch (tool) {
      case 'dev':
      case 'serve':
        devTools.startDevServer();
        break;
      case 'test':
      case 'watch':
        devTools.runTestsWatch();
        break;
      case 'analyze':
      case 'bundle':
        devTools.analyzeBundle();
        break;
      case 'circular':
        devTools.checkCircularDeps();
        break;
      case 'deps':
      case 'unused':
        devTools.checkUnusedDeps();
        break;
      case 'quality':
      case 'check':
        devTools.runQualityChecks();
        break;
      case 'report':
        devTools.generateDevReport();
        break;
      case 'debug':
        devTools.startDebugSession();
        break;
      case 'health':
      case 'monitor':
        devTools.monitorHealth();
        break;
      case 'clean':
        devTools.cleanDevArtifacts();
        break;
      case 'setup':
        devTools.setupDevEnv();
        break;
      default:
        logError(`Unknown tool: ${tool}`);
        logInfo('Available tools: dev, test, analyze, circular, deps, quality, report, debug, health, clean, setup');
        process.exit(1);
    }
    return;
  }

  // Interactive mode
  while (true) {
    showMenu();
    
    const answer = await new Promise(resolve => {
      rl.question('', resolve);
    });

    switch (answer.trim()) {
      case '1':
        devTools.startDevServer();
        break;
      case '2':
        devTools.runTestsWatch();
        break;
      case '3':
        devTools.analyzeBundle();
        break;
      case '4':
        devTools.checkCircularDeps();
        break;
      case '5':
        devTools.checkUnusedDeps();
        break;
      case '6':
        devTools.runQualityChecks();
        break;
      case '7':
        devTools.generateDevReport();
        break;
      case '8':
        devTools.startDebugSession();
        break;
      case '9':
        devTools.monitorHealth();
        break;
      case '10':
        devTools.cleanDevArtifacts();
        break;
      case '11':
        devTools.setupDevEnv();
        break;
      case '12':
        log('👋 Goodbye!', 'green');
        rl.close();
        process.exit(0);
      default:
        logError('Invalid selection. Please choose 1-12.');
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('\n\n👋 Development tools interrupted', 'yellow');
  rl.close();
  process.exit(0);
});

// Run the tools
main().catch(error => {
  logError(`Development tools failed: ${error.message}`);
  rl.close();
  process.exit(1);
});
