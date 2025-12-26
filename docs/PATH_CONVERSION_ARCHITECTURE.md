# Path Conversion Architecture

## Overview

The Path Conversion System is a comprehensive cross-platform path handling
solution that enables seamless file operations between Windows, WSL (Windows
Subsystem for Linux), and Unix environments. This document provides technical
details for developers working with or extending the path conversion system.

## Architecture Components

### Core Components

1. **PathConverter** (`src/utils/path-converter.ts`)
   - Core path conversion logic
   - Format detection and validation
   - Drive mapping management

2. **PathInterceptor** (`src/core/path-interceptor.ts`)
   - Tool call interception
   - Automatic path conversion in tool arguments and results
   - Tool-specific configuration management

3. **PathConverterConfigManager** (`src/core/path-converter-config.ts`)
   - Configuration management
   - Settings persistence
   - Environment detection

## Path Format Detection

### Supported Formats

```typescript
export enum PathFormat {
  WINDOWS = 'windows', // C:\path\to\file
  WSL = 'wsl', // /mnt/c/path/to/file
  UNIX = 'unix', // /home/user/file
  UNKNOWN = 'unknown', // Unrecognized format
}
```

### Detection Algorithm

The system uses regex patterns to detect path formats:

```typescript
// Windows path patterns
if (/^[A-Za-z]:[\\/]/.test(trimmedPath)) {
  return PathFormat.WINDOWS;
}

// UNC path pattern (\\server\share)
if (/^\\\\[\\]/.test(trimmedPath)) {
  return PathFormat.WINDOWS;
}

// WSL path pattern (/mnt/c/...)
if (/^\/mnt\/[a-zA-Z]\//.test(trimmedPath)) {
  return PathFormat.WSL;
}

// Unix/Linux path pattern (starts with / but not /mnt/)
if (/^\//.test(trimmedPath)) {
  return PathFormat.UNIX;
}
```

## Path Conversion Logic

### Windows to WSL Conversion

```typescript
public windowsToWSL(windowsPath: string): PathConversionResult {
  // Handle drive letters (C:\path\to\file)
  const driveMatch = /^([A-Za-z]):[\\/](.*)$/.exec(trimmedPath);
  if (driveMatch) {
    const drive = driveMatch[1].toLowerCase();
    const remainingPath = driveMatch[2].replace(/\\/g, '/');
    const mountPoint = this.driveMappings.get(drive + ':');

    if (mountPoint) {
      return {
        originalPath: windowsPath,
        convertedPath: `${mountPoint}/${remainingPath}`,
        originalFormat: PathFormat.WINDOWS,
        targetFormat: PathFormat.WSL,
        success: true
      };
    }
  }

  // Handle UNC paths (\\server\share)
  if (trimmedPath.startsWith('\\\\')) {
    const uncParts = trimmedPath.substring(2).split('\\');
    if (uncParts.length >= 2) {
      const server = uncParts[0];
      const share = uncParts[1];
      const remainingPath = uncParts.slice(2).join('/');
      return {
        originalPath: windowsPath,
        convertedPath: `/mnt/share/${server}/${share}/${remainingPath}`,
        originalFormat: PathFormat.WINDOWS,
        targetFormat: PathFormat.WSL,
        success: true
      };
    }
  }
}
```

### WSL to Windows Conversion

```typescript
public wslToWindows(wslPath: string): PathConversionResult {
  // Handle /mnt/drive/... pattern
  const mountMatch = /^\/mnt\/([a-zA-Z])\/(.*)$/.exec(trimmedPath);
  if (mountMatch) {
    const drive = mountMatch[1].toUpperCase();
    const remainingPath = mountMatch[2].replace(/\//g, '\\');

    return {
      originalPath: wslPath,
      convertedPath: `${drive}:\\${remainingPath}`,
      originalFormat: PathFormat.WSL,
      targetFormat: PathFormat.WINDOWS,
      success: true
    };
  }

  // Handle /mnt/share/server/share/... pattern (UNC conversion)
  const shareMatch = /^\/mnt\/share\/([^\/]+)\/([^\/]+)\/(.*)$/.exec(trimmedPath);
  if (shareMatch) {
    const server = shareMatch[1];
    const share = shareMatch[2];
    const remainingPath = shareMatch[3].replace(/\//g, '\\');

    return {
      originalPath: wslPath,
      convertedPath: `\\\\${server}\\${share}\\${remainingPath}`,
      originalFormat: PathFormat.WSL,
      targetFormat: PathFormat.WINDOWS,
      success: true
    };
  }
}
```

## Path Interception System

### Tool Configuration

Each tool can be configured for path conversion:

```typescript
export interface ToolPathConfig {
  toolName: string;
  pathParameters: string[]; // Parameter names that contain paths
  convertInput: boolean; // Whether to convert input paths
  convertOutput: boolean; // Whether to convert output paths
  targetFormat: PathFormat; // Target format for this tool
}
```

### Default Tool Configurations

```typescript
// AHK file tools typically need Windows paths
const ahkFileTools = [
  'AHK_File_Edit',
  'AHK_File_Edit_Advanced',
  'AHK_File_Edit_Diff',
  'AHK_File_Edit_Small',
  'AHK_File_View',
  'AHK_File_Active',
  'AHK_File_Detect',
  'AHK_Run',
  'AHK_Analyze',
];

ahkFileTools.forEach(toolName => {
  this.toolConfigs.set(toolName, {
    toolName,
    pathParameters: [
      'filePath',
      'file',
      'path',
      'scriptDir',
      'workingDirectory',
    ],
    convertInput: true,
    convertOutput: true,
    targetFormat: PathFormat.WINDOWS,
  });
});

// File system tools typically use WSL paths
const fileSystemTools = [
  'read_file',
  'write_file',
  'edit_file',
  'create_directory',
  'list_directory',
  'search_files',
  'get_file_info',
];

fileSystemTools.forEach(toolName => {
  this.toolConfigs.set(toolName, {
    toolName,
    pathParameters: ['path', 'source', 'destination'],
    convertInput: true,
    convertOutput: false,
    targetFormat: PathFormat.WSL,
  });
});
```

### Interception Process

#### Input Interception

```typescript
public interceptInput(toolName: string, args: Record<string, any>): InterceptionResult {
  const config = this.toolConfigs.get(toolName);
  if (!config || !config.convertInput) {
    return { success: true, originalData: args, modifiedData: args, conversions: [] };
  }

  const modifiedArgs = { ...args };
  const conversions: PathConversionResult[] = [];

  // Process each path parameter
  for (const paramName of config.pathParameters) {
    if (args[paramName]) {
      const conversionResult = this.processPathValue(
        args[paramName],
        config.targetFormat,
        paramName
      );

      if (conversionResult.success) {
        modifiedArgs[paramName] = conversionResult.convertedPath;
        conversions.push(conversionResult);
      }
    }
  }

  // Handle nested path parameters
  this.processNestedPaths(modifiedArgs, config, conversions);

  return {
    success: true,
    originalData: args,
    modifiedData: modifiedArgs,
    conversions
  };
}
```

#### Output Interception

```typescript
public interceptOutput(toolName: string, result: any): InterceptionResult {
  const config = this.toolConfigs.get(toolName);
  if (!config || !config.convertOutput) {
    return { success: true, originalData: result, modifiedData: result, conversions: [] };
  }

  const modifiedResult = this.cloneObject(result);
  const conversions: PathConversionResult[] = [];

  // Process paths in the result
  this.processResultPaths(modifiedResult, config, conversions);

  return {
    success: true,
    originalData: result,
    modifiedData: modifiedResult,
    conversions
  };
}
```

## Configuration Management

### Configuration Schema

```typescript
export interface PathConverterConfig {
  enabled: boolean;
  defaultTargetFormat: PathFormat;
  autoDetectEnvironment: boolean;
  driveMappings: DriveMapping[];
  toolConfigs: ToolPathConfig[];
  logging: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
    logConversions: boolean;
    logFailures: boolean;
  };
  performance: {
    enableCaching: boolean;
    maxCacheSize: number;
    cacheTimeout: number; // in milliseconds
  };
}
```

### Configuration File Locations

```typescript
export const CONFIG_PATHS = {
  userConfig: path.join(
    process.env.HOME || process.env.USERPROFILE || '',
    '.ahk-mcp',
    'path-converter.json'
  ),
  projectConfig: path.join(process.cwd(), '.ahk-mcp', 'path-converter.json'),
  fallbackConfig: path.join(
    __dirname,
    '../../config',
    'path-converter-default.json'
  ),
};
```

### Configuration Loading

```typescript
public async loadConfig(configPath?: string): Promise<PathConverterConfig> {
  const targetPath = configPath || this.configPath;

  try {
    if (!(await this.fileExists(targetPath))) {
      console.info(`Configuration file not found at ${targetPath}, using defaults`);
      await this.saveConfig(targetPath);
      return this.config;
    }

    const configData = await fs.readFile(targetPath, 'utf-8');
    const parsedConfig = JSON.parse(configData);

    // Validate the loaded configuration
    const validatedConfig = ConfigSchema.parse(parsedConfig);

    // Merge with defaults to ensure all properties are present
    this.config = this.mergeWithDefaults(validatedConfig);

    console.info(`Configuration loaded from ${targetPath}`);
    return this.config;

  } catch (error) {
    console.error(`Failed to load configuration from ${targetPath}:`, error);
    console.info('Using default configuration');
    return this.config;
  }
}
```

## Drive Mapping System

### Default Drive Mappings

```typescript
private initializeDefaultMappings(): void {
  for (let i = 65; i <= 90; i++) { // A-Z ASCII codes
    const drive = String.fromCharCode(i) + ':';
    const mountPoint = `${this.defaultWSLMountPoint}/${String.fromCharCode(i).toLowerCase()}`;
    this.driveMappings.set(drive.toLowerCase(), mountPoint);
  }
}
```

### Custom Drive Mappings

```typescript
public addDriveMapping(windowsDrive: string, wslMountPoint: string): void {
  this.driveMappings.set(windowsDrive.toLowerCase(), wslMountPoint);
}

public removeDriveMapping(windowsDrive: string): boolean {
  return this.driveMappings.delete(windowsDrive.toLowerCase());
}

public getDriveMappings(): DriveMapping[] {
  const mappings: DriveMapping[] = [];
  this.driveMappings.forEach((mountPoint, drive) => {
    mappings.push({
      windowsDrive: drive,
      wslMountPoint: mountPoint
    });
  });
  return mappings;
}
```

## Integration with Tools

### Tool Integration Pattern

Tools integrate with path conversion system by:

1. **Applying Input Interception**:

```typescript
// Apply path interception for cross-platform compatibility
const interceptionResult = pathInterceptor.interceptInput(
  'AHK_File_Edit',
  validatedArgs
);
if (!interceptionResult.success) {
  logger.warn(`Path interception failed: ${interceptionResult.error}`);
} else {
  validatedArgs = interceptionResult.modifiedData as z.infer<
    typeof AhkEditArgsSchema
  >;
  if (interceptionResult.conversions.length > 0) {
    logger.debug(
      `Path conversions applied: ${interceptionResult.conversions.length} paths converted`
    );
  }
}
```

2. **Applying Output Interception**:

```typescript
// Apply output path interception for cross-platform compatibility
const outputInterception = pathInterceptor.interceptOutput(
  'AHK_File_Edit',
  result
);
if (outputInterception.success) {
  result = outputInterception.modifiedData;
  if (outputInterception.conversions.length > 0) {
    logger.debug(
      `Output path conversions applied: ${outputInterception.conversions.length} paths converted`
    );
  }
}
```

3. **Direct Path Conversion**:

```typescript
// Apply path conversion for cross-platform compatibility
try {
  const pathConversion = pathConverter.autoConvert(
    targetFile,
    PathFormat.WINDOWS
  );
  if (pathConversion.success) {
    targetFile = pathConversion.convertedPath;
    logger.debug(
      `Path converted from ${pathConversion.originalPath} to ${targetFile}`
    );
  } else {
    logger.warn(`Path conversion failed: ${pathConversion.error}`);
  }
} catch (error) {
  logger.warn(
    `Path conversion error: ${error instanceof Error ? error.message : String(error)}`
  );
}
```

## Performance Optimization

### Caching System

Path conversions are cached to improve performance:

```typescript
interface CacheEntry {
  convertedPath: string;
  timestamp: number;
}

private cache: Map<string, CacheEntry> = new Map();

private getCachedConversion(inputPath: string, targetFormat: PathFormat): string | null {
  const cacheKey = `${inputPath}:${targetFormat}`;
  const entry = this.cache.get(cacheKey);

  if (entry && Date.now() - entry.timestamp < this.cacheTimeout) {
    return entry.convertedPath;
  }

  return null;
}

private setCachedConversion(inputPath: string, targetFormat: PathFormat, convertedPath: string): void {
  const cacheKey = `${inputPath}:${targetFormat}`;

  // Remove oldest entries if cache is full
  if (this.cache.size >= this.maxCacheSize) {
    const oldestKey = this.cache.keys().next().value;
    this.cache.delete(oldestKey);
  }

  this.cache.set(cacheKey, {
    convertedPath,
    timestamp: Date.now()
  });
}
```

### Batch Processing

Multiple path conversions can be processed efficiently:

```typescript
public batchConvert(paths: string[], targetFormat: PathFormat): PathConversionResult[] {
  return paths.map(path => this.autoConvert(path, targetFormat));
}
```

## Error Handling

### Conversion Error Types

```typescript
export enum ConversionErrorType {
  INVALID_FORMAT = 'invalid_format',
  UNSUPPORTED_CONVERSION = 'unsupported_conversion',
  DRIVE_NOT_MAPPED = 'drive_not_mapped',
  PATH_NOT_FOUND = 'path_not_found',
  PERMISSION_DENIED = 'permission_denied',
  INVALID_SYNTAX = 'invalid_syntax',
}
```

### Error Handling Pattern

```typescript
public autoConvert(inputPath: string, targetFormat: PathFormat): PathConversionResult {
  try {
    const originalFormat = this.detectPathFormat(inputPath);

    if (originalFormat === PathFormat.UNKNOWN) {
      return {
        originalPath: inputPath,
        convertedPath: inputPath,
        originalFormat,
        targetFormat,
        success: false,
        error: 'Unable to detect path format'
      };
    }

    if (originalFormat === targetFormat) {
      return {
        originalPath: inputPath,
        convertedPath: inputPath,
        originalFormat,
        targetFormat,
        success: true
      };
    }

    // Perform conversion based on formats
    switch (targetFormat) {
      case PathFormat.WSL:
        return this.windowsToWSL(inputPath);
      case PathFormat.WINDOWS:
        return this.wslToWindows(inputPath);
      default:
        return {
          originalPath: inputPath,
          convertedPath: inputPath,
          originalFormat,
          targetFormat,
          success: false,
          error: `Conversion to ${targetFormat} format is not supported`
        };
    }
  } catch (error) {
    return {
      originalPath: inputPath,
      convertedPath: inputPath,
      originalFormat: PathFormat.UNKNOWN,
      targetFormat,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
```

## Extension Guidelines

### Adding New Path Formats

1. **Update PathFormat Enum**:

```typescript
export enum PathFormat {
  WINDOWS = 'windows',
  WSL = 'wsl',
  UNIX = 'unix',
  MACOS = 'macos', // New format
  UNKNOWN = 'unknown',
}
```

2. **Add Detection Logic**:

```typescript
public detectPathFormat(inputPath: string): PathFormat {
  // Existing detection logic...

  // macOS path pattern
  if (/^\/Users\/[^\/]+/.test(trimmedPath)) {
    return PathFormat.MACOS;
  }

  return PathFormat.UNKNOWN;
}
```

3. **Implement Conversion Methods**:

```typescript
public macosToWindows(macosPath: string): PathConversionResult {
  // Implementation for macOS to Windows conversion
}

public windowsToMacos(windowsPath: string): PathConversionResult {
  // Implementation for Windows to macOS conversion
}
```

4. **Update Auto-Convert Logic**:

```typescript
public autoConvert(inputPath: string, targetFormat: PathFormat): PathConversionResult {
  // Existing logic...

  switch (targetFormat) {
    case PathFormat.WSL:
      return this.windowsToWSL(inputPath);
    case PathFormat.WINDOWS:
      return this.wslToWindows(inputPath);
    case PathFormat.MACOS:
      return this.windowsToMacos(inputPath);
    // Add other cases...
  }
}
```

### Adding New Tool Configurations

```typescript
// Add custom tool configuration
pathInterceptor.addToolConfig({
  toolName: 'CUSTOM_TOOL',
  pathParameters: ['customPath', 'outputPath'],
  convertInput: true,
  convertOutput: true,
  targetFormat: PathFormat.WINDOWS,
});
```

### Custom Drive Mappings

```typescript
// Add custom drive mapping
pathConverter.addDriveMapping('Z:', '/mnt/z');

// Add network share mapping
pathConverter.addDriveMapping('NETWORK:', '/mnt/share/network');
```

## Testing

### Unit Testing Pattern

```typescript
describe('PathConverter', () => {
  let converter: PathConverter;

  beforeEach(() => {
    converter = new PathConverter();
  });

  describe('windowsToWSL', () => {
    it('should convert simple Windows path to WSL', () => {
      const result = converter.windowsToWSL('C:\\Scripts\\test.ahk');

      expect(result.success).toBe(true);
      expect(result.convertedPath).toBe('/mnt/c/Scripts/test.ahk');
      expect(result.originalFormat).toBe(PathFormat.WINDOWS);
      expect(result.targetFormat).toBe(PathFormat.WSL);
    });

    it('should handle UNC paths', () => {
      const result = converter.windowsToWSL('\\\\server\\share\\file.ahk');

      expect(result.success).toBe(true);
      expect(result.convertedPath).toBe('/mnt/share/server/share/file.ahk');
    });
  });
});
```

### Integration Testing Pattern

```typescript
describe('PathInterceptor Integration', () => {
  let interceptor: PathInterceptor;

  beforeEach(() => {
    interceptor = new PathInterceptor();
  });

  it('should intercept and convert tool input paths', () => {
    const args = {
      filePath: 'C:\\Scripts\\test.ahk',
      content: 'test content',
    };

    const result = interceptor.interceptInput('AHK_File_Edit', args);

    expect(result.success).toBe(true);
    expect(result.modifiedData.filePath).toBe('/mnt/c/Scripts/test.ahk');
    expect(result.conversions).toHaveLength(1);
  });
});
```

## Debugging

### Debug Logging

Enable debug logging for path conversion:

```typescript
// In configuration
{
  "logging": {
    "enabled": true,
    "level": "debug",
    "logConversions": true,
    "logFailures": true
  }
}
```

### Debug Utilities

```typescript
// Test path conversion manually
const testConversion = pathConverter.autoConvert(
  'C:\\Scripts\\test.ahk',
  PathFormat.WSL
);
console.log('Conversion result:', testConversion);

// Get current drive mappings
const mappings = pathConverter.getDriveMappings();
console.log('Drive mappings:', mappings);

// Get tool configurations
const configs = pathInterceptor.getAllToolConfigs();
console.log('Tool configs:', configs);
```

## Best Practices

### Performance

1. **Use Caching**: Enable caching for frequently used paths
2. **Batch Operations**: Process multiple paths together when possible
3. **Avoid Redundant Conversions**: Cache conversion results
4. **Optimize Regex**: Use efficient regex patterns for format detection

### Reliability

1. **Validate Input**: Always validate path formats before conversion
2. **Handle Errors Gracefully**: Provide meaningful error messages
3. **Fallback Strategies**: Provide fallbacks when conversion fails
4. **Log Failures**: Log conversion failures for debugging

### Maintainability

1. **Use Type Safety**: Leverage TypeScript for type safety
2. **Modular Design**: Keep conversion logic modular
3. **Configuration Driven**: Make behavior configurable
4. **Comprehensive Testing**: Test all conversion scenarios

## Conclusion

The Path Conversion Architecture provides a robust, extensible solution for
cross-platform path handling in the AutoHotkey MCP Server. It addresses the
common "No result received from client-side tool execution" errors by ensuring
seamless path conversion between Windows, WSL, and Unix environments.

The system is designed to be:

- **Automatic**: No manual path conversion required
- **Configurable**: Extensive configuration options
- **Extensible**: Easy to add new path formats and tools
- **Performant**: Caching and optimization for high performance
- **Reliable**: Comprehensive error handling and validation

This architecture enables developers to focus on AutoHotkey functionality rather
than path compatibility issues.
