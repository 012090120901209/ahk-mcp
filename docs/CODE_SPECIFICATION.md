# AutoHotkey v2 MCP Server - Code Specification

## 1. Repository Overview

### 1.1 Purpose

The AutoHotkey v2 MCP Server is a TypeScript-based Model Context Protocol (MCP)
server that provides comprehensive development tools, code analysis, and script
execution capabilities for AutoHotkey v2 development. It acts as an intelligent
assistant for AutoHotkey developers, offering LSP-like features through the MCP
protocol.

### 1.2 Core Capabilities

- **Syntax Analysis & Diagnostics**: Real-time code validation with AutoHotkey
  v2 syntax checking
- **Code Standards Enforcement**: Claude-specific coding standards validation
- **Script Execution**: Run and watch AutoHotkey scripts with process management
- **Documentation Search**: Fast indexed search across AutoHotkey v2
  documentation
- **Window Detection**: Verify GUI script window creation
- **VS Code Integration**: Problem detection and active file tracking
- **Context Injection**: Automatic documentation enhancement for AI responses
- **Debug Support**: Advanced debugging agent for script troubleshooting

### 1.3 Technology Stack

- **Language**: TypeScript 5.3.3 with ES2020 target
- **Runtime**: Node.js 18+ with ES modules
- **Protocol**: MCP (Model Context Protocol) via stdio
- **Validation**: Zod 3.22.4 for schema validation
- **Search**: FlexSearch 0.7.43 for documentation indexing
- **Build**: TypeScript compiler with strict mode

## 2. Architecture & System Design

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MCP Client (Claude)                   │
└──────────────────────┬──────────────────────────────────┘
                       │ stdio (JSON-RPC 2.0)
┌──────────────────────▼──────────────────────────────────┐
│                  AutoHotkeyMcpServer                     │
│  ┌────────────────────────────────────────────────────┐ │
│  │                  Request Handlers                   │ │
│  │  • ListTools  • CallTool  • ListPrompts           │ │
│  │  • GetPrompt  • ListResources  • ReadResource     │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │                    Tool System                      │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐          │ │
│  │  │Diagnostic│ │  Run     │ │  Debug   │  ...13   │ │
│  │  │  Tool    │ │  Tool    │ │  Agent   │  tools   │ │
│  │  └──────────┘ └──────────┘ └──────────┘          │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │                  Core Components                    │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐          │ │
│  │  │  Parser  │ │  Loader  │ │Standards │          │ │
│  │  │          │ │          │ │  Engine  │          │ │
│  │  └──────────┘ └──────────┘ └──────────┘          │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│           External Systems & Resources                   │
│  • AutoHotkey v2 Executable                             │
│  • File System (scripts, configs)                       │
│  • VS Code (problems, active file)                      │
│  • Windows Process Management                           │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Module Structure

```
ahk-mcp/
├── src/
│   ├── index.ts                 # Entry point
│   ├── server.ts                 # MCP server implementation
│   ├── logger.ts                 # Logging utility
│   ├── core/                     # Core functionality
│   │   ├── loader.ts             # Data loading & search
│   │   ├── parser.ts             # AutoHotkey code parser
│   │   ├── config.ts             # Configuration management
│   │   ├── claude-standards.ts   # Coding standards engine
│   │   └── compiler/             # Compilation utilities
│   ├── lsp/                      # LSP-like capabilities
│   │   └── diagnostics.ts        # Diagnostic provider
│   ├── tools/                    # MCP tool implementations
│   │   ├── ahk-diagnostics.ts    # Code validation
│   │   ├── ahk-run.ts            # Script execution
│   │   ├── ahk-debug-agent.ts    # Debug assistance
│   │   ├── ahk-doc-search.ts     # Documentation search
│   │   ├── ahk-analyze.ts        # Code analysis
│   │   ├── ahk-summary.ts        # Documentation summary
│   │   ├── ahk-prompts.ts        # Prompt management
│   │   ├── ahk-context-injector.ts # Context enhancement
│   │   ├── ahk-sampling-enhancer.ts # Sampling optimization
│   │   ├── ahk-vscode-problems.ts  # VS Code integration
│   │   ├── ahk-recent.ts         # Recent scripts tracking
│   │   ├── ahk-config.ts         # Configuration tool
│   │   └── ahk-active-file.ts    # Active file tracking
│   └── types/                    # TypeScript definitions
│       ├── index.ts              # Type exports
│       ├── lsp-types.ts          # LSP type definitions
│       ├── ahk-ast.ts            # AST definitions
│       └── tool-types.ts         # Tool argument types
├── data/                         # Static data files
│   ├── ahk_index.json            # Lightweight index
│   ├── ahk_documentation_full.json # Complete docs
│   └── ahk_documentation_index.json # Search index
└── dist/                         # Compiled output
```

### 2.3 Data Flow

1. **Request Flow**:
   - MCP client sends JSON-RPC request via stdio
   - Server validates request schema
   - Routes to appropriate handler
   - Handler executes tool/prompt/resource operation
   - Response formatted and returned via stdio

2. **Tool Execution Flow**:
   - Tool arguments validated with Zod schema
   - Tool instance executes operation
   - May interact with external systems (files, processes)
   - Results formatted as MCP content blocks
   - Error handling with informative messages

3. **Process Management Flow**:
   - AutoHotkey processes spawned with tracked PIDs
   - File watchers established with debouncing
   - Graceful cleanup on exit signals
   - Window detection via PowerShell polling

## 3. API Specifications

### 3.1 MCP Tools

#### AHK_Diagnostics

```typescript
interface AhkDiagnosticsArgs {
  code: string; // AutoHotkey v2 code to analyze
  enableClaudeStandards?: boolean; // Apply coding standards (default: true)
  severity?: 'error' | 'warning' | 'info' | 'all'; // Filter level
}
```

**Purpose**: Validates AutoHotkey v2 syntax and enforces coding standards
**Returns**: Diagnostic messages grouped by severity with line/column info

#### AHK_Run

```typescript
interface AhkRunArgs {
  mode: 'run' | 'watch'; // Execution mode
  filePath?: string; // Script path (or active file)
  ahkPath?: string; // AutoHotkey executable path
  errorStdOut?: 'utf-8' | 'cp1252'; // Error encoding
  workingDirectory?: string; // Working directory
  enabled?: boolean; // Enable/disable watcher
  runner?: 'native' | 'powershell'; // Process runner
  wait?: boolean; // Wait for exit
  scriptArgs?: string[]; // Script arguments
  timeout?: number; // Process timeout (ms)
  killOnExit?: boolean; // Kill on watcher stop
  detectWindow?: boolean; // Detect GUI window
  windowDetectTimeout?: number; // Window detection timeout
  windowTitle?: string; // Expected window title
  windowClass?: string; // Expected window class
}
```

**Purpose**: Execute AutoHotkey scripts with process management **Returns**:
Execution status, PID, exit code, window detection results

#### AHK_Debug_Agent

```typescript
interface AhkDebugAgentArgs {
  code?: string; // Code to debug
  filePath?: string; // File to debug
  action: 'analyze' | 'trace' | 'fix' | 'explain';
  errorMessage?: string; // Error to analyze
  options?: {
    includeVariables?: boolean;
    includeCallStack?: boolean;
    suggestFixes?: boolean;
  };
}
```

**Purpose**: Advanced debugging assistance for AutoHotkey scripts **Returns**:
Debug analysis, trace logs, fix suggestions

#### AHK_Doc_Search

```typescript
interface AhkDocSearchArgs {
  query: string; // Search query
  limit?: number; // Result limit (default: 10)
  categories?: string[]; // Filter categories
  exactMatch?: boolean; // Exact match only
}
```

**Purpose**: Search AutoHotkey v2 documentation **Returns**: Ranked search
results with snippets

#### AHK_Analyze

```typescript
interface AhkAnalyzeArgs {
  code: string; // Code to analyze
  includeDocumentation?: boolean; // Include docs
  includeUsageExamples?: boolean; // Include examples
  analyzeComplexity?: boolean; // Complexity metrics
}
```

**Purpose**: Deep code analysis with metrics and suggestions **Returns**:
Analysis report with identified patterns and improvements

#### AHK_Context_Injector

```typescript
interface AhkContextInjectorArgs {
  prompt: string; // User prompt
  maxContextSize?: number; // Max context chars
  includeExamples?: boolean; // Include examples
}
```

**Purpose**: Inject relevant AutoHotkey documentation into prompts **Returns**:
Enhanced prompt with contextual documentation

#### AHK_Sampling_Enhancer

```typescript
interface AhkSamplingEnhancerArgs {
  request: string; // Original request
  context?: string; // Additional context
}
```

**Purpose**: Optimize prompts for MCP sampling **Returns**: Enhanced request
with structured context

#### AHK_VSCode_Problems

```typescript
interface AhkVSCodeProblemsArgs {
  workspace?: string; // Workspace path
  severity?: 'error' | 'warning' | 'info' | 'all';
}
```

**Purpose**: Read VS Code problems panel **Returns**: Current problems from VS
Code

#### AHK_File_Recent

```typescript
interface AhkRecentArgs {
  limit?: number; // Number of scripts
  includeContent?: boolean; // Include file content
}
```

**Purpose**: Track recently accessed AutoHotkey scripts **Returns**: List of
recent scripts with metadata

#### AHK_Config

```typescript
interface AhkConfigArgs {
  action: 'get' | 'set' | 'reset';
  key?: string; // Config key
  value?: any; // Config value
}
```

**Purpose**: Manage server configuration **Returns**: Configuration state

#### AHK_Active_File

```typescript
interface AhkActiveFileArgs {
  action: 'get' | 'set';
  filePath?: string; // File path to set
}
```

**Purpose**: Track currently active AutoHotkey file **Returns**: Active file
path

#### AHK_Summary

No arguments required **Purpose**: Provide summary of available AutoHotkey
documentation **Returns**: Statistics and categories of loaded documentation

#### AHK_Prompts

No arguments required **Purpose**: List available AutoHotkey expertise prompts
**Returns**: Curated prompts for common tasks

### 3.2 MCP Resources

#### Documentation Resources

- `ahk://context/auto` - Auto-context based on keywords
- `ahk://docs/functions` - Function reference
- `ahk://docs/variables` - Variable reference
- `ahk://docs/classes` - Class reference
- `ahk://docs/methods` - Method reference

#### Template Resources

- `ahk://templates/file-system-watcher` - File monitoring template
- `ahk://templates/clipboard-manager` - Clipboard management template
- `ahk://templates/cpu-monitor` - System monitoring template
- `ahk://templates/hotkey-toggle` - Hotkey management template

#### System Resources

- `ahk://system/clipboard` - Live clipboard content
- `ahk://system/info` - System information

### 3.3 MCP Prompts

Dynamic prompts generated from AutoHotkey expertise library, including:

- GUI development patterns
- Hotkey implementation
- File operations
- Window manipulation
- COM automation
- Performance optimization

## 4. Data Structures & Schemas

### 4.1 Core Data Types

```typescript
// Position in code
interface Position {
  line: number; // 0-based line number
  character: number; // 0-based character offset
}

// Range in code
interface Range {
  start: Position;
  end: Position;
}

// Diagnostic information
interface Diagnostic {
  range: Range;
  severity: DiagnosticSeverity;
  message: string;
  code?: string;
  source?: string;
}

enum DiagnosticSeverity {
  Error = 1,
  Warning = 2,
  Information = 3,
  Hint = 4,
}
```

### 4.2 AutoHotkey Index Structure

```typescript
interface AhkIndex {
  version: string;
  description: string;
  variables: AhkIndexVariable[];
  functions: AhkIndexFunction[];
  classes: AhkIndexClass[];
  methods: AhkIndexMethod[];
  directives: AhkIndexDirective[];
  flowControls: AhkIndexFlowControl[];
  operators: AhkIndexOperator[];
}

interface AhkIndexFunction {
  Name: string;
  Category: string;
  Description: string;
  Parameters?: Parameter[];
  ReturnType?: string;
  Examples?: Example[];
}

interface AhkIndexClass {
  Name: string;
  Category: string;
  Description: string;
  Methods?: AhkIndexMethod[];
  Properties?: Property[];
}
```

### 4.3 Process Management

```typescript
interface ProcessInfo {
  pid: number;
  startTime: number;
  filePath: string;
}

interface WatchState {
  filePath?: string;
  watcher?: FSWatcher;
  lastRun?: number;
  runningProcesses: Map<number, ProcessInfo>;
  debounceTimer?: NodeJS.Timeout;
}
```

### 4.4 Configuration Schema

```typescript
interface ServerConfig {
  activeFile?: string;
  recentFiles: string[];
  ahkPath?: string;
  defaultRunner: 'native' | 'powershell';
  debugLevel: 'error' | 'warn' | 'info' | 'debug';
  enableClaudeStandards: boolean;
  maxRecentFiles: number;
}
```

## 5. Implementation Guidelines

### 5.1 Code Standards

#### TypeScript Requirements

- **Strict Mode**: All code must pass TypeScript strict checks
- **Type Safety**: No implicit `any` types in production code
- **Async/Await**: Use async/await for all asynchronous operations
- **Error Handling**: Wrap all async operations in try-catch blocks

#### Validation Pattern

```typescript
// All tool inputs must be validated with Zod
export const ToolArgsSchema = z.object({
  requiredField: z.string(),
  optionalField: z.number().optional().default(10),
  enumField: z.enum(['option1', 'option2']),
});

// Parse and validate
const validatedArgs = ToolArgsSchema.parse(args);
```

#### Error Response Pattern

```typescript
// Consistent error response format
return {
  content: [
    {
      type: 'text',
      text: `Error: ${error.message}`,
    },
  ],
  isError: true,
};
```

#### Success Response Pattern

```typescript
// Consistent success response format
return {
  content: [
    { type: 'text', text: 'Operation completed' },
    { type: 'text', text: JSON.stringify(data, null, 2) },
  ],
};
```

### 5.2 File Operations

#### Path Validation

```typescript
// Always validate and normalize paths
const normalizedPath = path.resolve(filePath);
if (!normalizedPath.toLowerCase().endsWith('.ahk')) {
  throw new Error('File must have .ahk extension');
}

// Check file existence
try {
  await fs.access(normalizedPath);
} catch {
  throw new Error(`File not found: ${normalizedPath}`);
}
```

#### File Watching

```typescript
// Implement debouncing for file watchers
const DEBOUNCE_MS = 250;
let debounceTimer: NodeJS.Timeout;

watcher.on('change', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(handleChange, DEBOUNCE_MS);
});
```

### 5.3 Process Management

#### Process Spawning

```typescript
// Track all spawned processes
const processMap = new Map<number, ProcessInfo>();

const child = spawn(command, args, {
  cwd: workingDir,
  windowsHide: false,
  stdio: 'inherit',
});

processMap.set(child.pid, {
  pid: child.pid,
  startTime: Date.now(),
  filePath: scriptPath,
});
```

#### Cleanup Handlers

```typescript
// Register cleanup handlers for graceful shutdown
process.on('exit', cleanup);
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

function cleanup() {
  // Kill running processes
  for (const [pid] of processMap) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      /* Process may have exited */
    }
  }
  // Close file watchers
  watchers.forEach(w => w.close());
}
```

### 5.4 Logging Standards

```typescript
// Use structured logging with levels
logger.error('Operation failed', { error, context });
logger.warn('Deprecation warning', { feature });
logger.info('Tool executed', { tool: name, args });
logger.debug('Internal state', { state });
```

### 5.5 Documentation Requirements

#### Tool Documentation

- Each tool must have a clear description
- All parameters must be documented with types
- Include usage examples in tool definitions
- Document return value structure

#### Code Documentation

```typescript
/**
 * Execute AutoHotkey script with process management
 * @param args - Validated tool arguments
 * @returns Execution result with status and metadata
 * @throws Error if AutoHotkey not found or script invalid
 */
async execute(args: AhkRunArgs): Promise<ExecutionResult> {
  // Implementation
}
```

### 5.6 Testing Guidelines

#### Unit Test Structure

```typescript
describe('ToolName', () => {
  beforeEach(() => {
    // Setup test environment
  });

  afterEach(() => {
    // Cleanup
  });

  it('should validate input arguments', async () => {
    // Test Zod validation
  });

  it('should handle errors gracefully', async () => {
    // Test error scenarios
  });

  it('should return expected format', async () => {
    // Test output format
  });
});
```

#### Integration Test Pattern

```typescript
// Test actual MCP communication
const server = new AutoHotkeyMcpServer();
const response = await server.handleRequest({
  jsonrpc: '2.0',
  method: 'tools/call',
  params: { name: 'AHK_Diagnostics', arguments: { code } },
});
```

### 5.7 Performance Considerations

#### Data Loading

- Use lazy loading for large datasets
- Implement light mode for reduced memory usage
- Cache frequently accessed data
- Use streaming for large file operations

#### Search Optimization

- Pre-index documentation with FlexSearch
- Implement result ranking algorithms
- Cache search results with TTL
- Limit result sets with pagination

#### Process Management

- Implement timeouts for all external processes
- Use process pools for concurrent operations
- Monitor resource usage
- Implement circuit breakers for failing operations

## 6. Security Considerations

### 6.1 Input Validation

- Validate all file paths against path traversal
- Sanitize command arguments before execution
- Validate AutoHotkey executable signatures
- Limit resource consumption

### 6.2 Process Isolation

- Run AutoHotkey scripts with limited privileges
- Implement process timeouts
- Monitor and limit memory usage
- Prevent command injection

### 6.3 File System Security

- Validate file extensions
- Check file permissions before access
- Implement safe path resolution
- Prevent access to system directories

## 7. Deployment & Configuration

### 7.1 Environment Variables

```bash
AHK_MCP_DATA_MODE=light|full    # Data loading mode
AHK_MCP_LOG_LEVEL=debug|info|warn|error
AHK_MCP_TIMEOUT=30000           # Default timeout in ms
NODE_ENV=development|production
```

### 7.2 Build Process

```bash
npm run clean                    # Clean dist directory
npm run build                    # Compile TypeScript
npm run dev                      # Development mode
npm run lint                     # Run ESLint
```

### 7.3 MCP Client Configuration

```json
{
  "mcpServers": {
    "ahk-server": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "AHK_MCP_DATA_MODE": "full"
      }
    }
  }
}
```

## 8. Extension Points

### 8.1 Adding New Tools

1. Create tool file in `src/tools/`
2. Define Zod schema for arguments
3. Implement tool class with `execute()` method
4. Register in server.ts tool handlers
5. Add type definitions to tool-types.ts

### 8.2 Custom Standards

1. Extend ClaudeStandardsEngine class
2. Add new validation rules
3. Define severity levels
4. Implement fix suggestions

### 8.3 Documentation Extensions

1. Add new data files to `data/` directory
2. Update loader.ts to include new datasets
3. Implement search indexing
4. Add resource endpoints

## 9. Version History

- **v2.0.0**: Current version with full MCP implementation
- **v1.x**: Legacy versions (deprecated)

## 10. License & Contributing

This specification defines the technical implementation of the AutoHotkey v2 MCP
Server. Contributions should follow these guidelines and maintain compatibility
with the MCP protocol specification.
