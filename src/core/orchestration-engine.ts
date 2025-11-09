import { ToolFactory } from './tool-factory.js';
import { ToolRegistry } from './tool-registry.js';
import { DebugFormatter, createDebugFormatter } from '../utils/debug-formatter.js';
import { promises as fs } from 'fs';
import path from 'path';
import { codeQualityManager, CodeQualityReport, LintLevel } from './linting/code-quality-manager.js';
import logger from '../logger.js';

/**
 * Cache entry with TTL support
 */
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  fileMtime?: number;
  ttl: number;
}

/**
 * Orchestration request from user
 */
export interface OrchestrationRequest {
  intent: string;
  filePath?: string;
  targetEntity?: string;
  operation?: 'view' | 'edit' | 'analyze';
  forceRefresh?: boolean;
  debugMode?: boolean;
  // Code quality options
  lintLevel?: LintLevel;
  skipLinting?: boolean;
  includeCodeQuality?: boolean;
}

/**
 * Detected intent with metadata
 */
export interface OrchestrationIntent {
  action: 'view' | 'edit' | 'analyze' | 'run' | 'detect';
  targetFile?: string;
  targetEntity?: string;
  confidence: number;
  metadata: Record<string, any>;
}

/**
 * Execution context for orchestration
 */
export interface OrchestrationContext {
  sessionId: string;
  startTime: number;
  toolCalls: number;
  cacheHits: number;
  debugFormatter?: DebugFormatter;
  activeFile?: string;
  codeQualityReport?: CodeQualityReport;
  lintLevel?: LintLevel;
}

/**
 * Result from orchestration execution
 */
export interface OrchestrationResult {
  success: boolean;
  content: any[];
  toolCalls: number;
  cacheHits: number;
  duration: number;
  debugOutput?: string;
  error?: string;
  codeQualityReport?: CodeQualityReport;
}

/**
 * File analysis result from cache
 */
interface FileAnalysisResult {
  classes: Array<{
    name: string;
    startLine: number;
    endLine: number;
    methods: Array<{
      name: string;
      startLine: number;
      endLine: number;
    }>;
  }>;
  functions: Array<{
    name: string;
    startLine: number;
    endLine: number;
  }>;
  hotkeys: Array<{
    name: string;
    startLine: number;
    endLine: number;
  }>;
  metadata: {
    lineCount: number;
    lastModified: number;
    filePath?: string;
  };
}

/**
 * OrchestrationEngine for Smart File Orchestrator
 * 
 * Manages session-based caching, intelligent tool chaining,
 * and reduces tool calls from 7-10 down to 3-4 through smart caching.
 */
export class OrchestrationEngine {
  private cache = new Map<string, CacheEntry>();
  private toolFactory: ToolFactory;
  private toolRegistry: ToolRegistry;
  private defaultTTL = 300000; // 5 minutes
  private sessionCount = 0;

  constructor(toolFactory: ToolFactory, toolRegistry: ToolRegistry) {
    this.toolFactory = toolFactory;
    this.toolRegistry = toolRegistry;
  }

  /**
   * Main entry point for processing orchestration requests
   */
  async processIntent(request: OrchestrationRequest): Promise<OrchestrationResult> {
    const sessionId = `session-${++this.sessionCount}`;
    const startTime = Date.now();
    
    const context: OrchestrationContext = {
      sessionId,
      startTime,
      toolCalls: 0,
      cacheHits: 0,
      debugFormatter: request.debugMode ? createDebugFormatter() : undefined
    };

    try {
      // Detect intent from user request
      const intent = this.detectIntent(request.intent, request);
      
      // Log intent detection if in debug mode
      if (context.debugFormatter) {
        context.debugFormatter.addEntry({
          tool: 'IntentDetector',
          reason: `Detected ${intent.action} intent with ${intent.confidence}% confidence`,
          duration: 0,
          metadata: {
            action: intent.action,
            targetFile: intent.targetFile,
            targetEntity: intent.targetEntity
          }
        });
      }

      // Determine lint level for this operation
      const lintLevel = this.determineLintLevel(request, intent.action);
      context.lintLevel = lintLevel;

      // Run code quality check if applicable
      const filePath = intent.targetFile || request.filePath;
      if (filePath && lintLevel !== 'none') {
        const qualityReport = await this.runCodeQualityCheck(filePath, lintLevel, context);
        if (qualityReport) {
          context.codeQualityReport = qualityReport;

          // Log summary
          logger.info(`Code quality for ${filePath}: ${qualityReport.errors.length} errors, ${qualityReport.warnings.length} warnings`);
        }
      }

      // Execute the optimal tool chain
      const result = await this.executeToolChain(intent, context, request);

      // Schedule background thorough analysis if this was an edit operation
      if (intent.action === 'edit' && filePath && lintLevel === 'standard') {
        this.scheduleBackgroundLinting(filePath, context);
      }
      
      const duration = Date.now() - startTime;

      // Append code quality summary if requested and available
      if (request.includeCodeQuality && context.codeQualityReport) {
        const report = context.codeQualityReport;
        const summary = this.formatCodeQualitySummary(report);
        result.content.push({
          type: 'text',
          text: summary
        });
      }

      return {
        success: true,
        content: result.content,
        toolCalls: context.toolCalls,
        cacheHits: context.cacheHits,
        duration,
        debugOutput: context.debugFormatter?.format(),
        codeQualityReport: context.codeQualityReport
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        success: false,
        content: [{
          type: 'text',
          text: `❌ **Orchestration Failed**\n\n🔧 Tool calls made: ${context.toolCalls}\n\n**Error:**\n  ${errorMessage}`
        }],
        toolCalls: context.toolCalls,
        cacheHits: context.cacheHits,
        duration,
        debugOutput: context.debugFormatter?.format(),
        error: errorMessage
      };
    }
  }

  /**
   * Detect user intent from natural language input
   */
  private detectIntent(input: string, request: OrchestrationRequest): OrchestrationIntent {
    const lowerInput = input.toLowerCase();
    
    // Determine action from operation parameter or input analysis
    let action: OrchestrationIntent['action'] = 'view';
    let confidence = 80;
    
    if (request.operation) {
      action = request.operation;
      confidence = 100;
    } else {
      // Analyze input for action keywords
      if (lowerInput.includes('edit') || lowerInput.includes('modify') || lowerInput.includes('change')) {
        action = 'edit';
        confidence = 90;
      } else if (lowerInput.includes('analyze') || lowerInput.includes('structure') || lowerInput.includes('overview')) {
        action = 'analyze';
        confidence = 90;
      } else if (lowerInput.includes('run') || lowerInput.includes('execute')) {
        action = 'run';
        confidence = 90;
      }
    }

    // Extract target file if not provided
    let targetFile = request.filePath;
    if (!targetFile) {
      // Look for .ahk file references in input
      const fileMatch = input.match(/([a-zA-Z0-9_\-]+\.ahk)/i);
      if (fileMatch) {
        targetFile = fileMatch[1];
        confidence = Math.min(confidence + 10, 100);
      }
    }

    // Extract target entity if not provided
    let targetEntity = request.targetEntity;
    if (!targetEntity) {
      // Look for class.method patterns or class names
      const classMethodMatch = input.match(/([A-Z][a-zA-Z0-9_]*)\.([A-Z][a-zA-Z0-9_]*)/);
      if (classMethodMatch) {
        targetEntity = `${classMethodMatch[1]}.${classMethodMatch[2]}`;
        confidence = Math.min(confidence + 15, 100);
      } else {
        const classMatch = input.match(/([A-Z][a-zA-Z0-9_]*)/);
        if (classMatch) {
          targetEntity = classMatch[1];
          confidence = Math.min(confidence + 10, 100);
        }
      }
    }

    return {
      action,
      targetFile,
      targetEntity,
      confidence,
      metadata: {
        originalInput: input,
        hasExplicitPath: !!request.filePath,
        hasExplicitEntity: !!request.targetEntity,
        hasExplicitOperation: !!request.operation
      }
    };
  }

  /**
   * Determine optimal lint level based on operation type
   */
  private determineLintLevel(request: OrchestrationRequest, action: OrchestrationIntent['action']): LintLevel {
    // User explicitly specified level
    if (request.lintLevel) {
      return request.lintLevel;
    }

    // Skip if explicitly disabled
    if (request.skipLinting) {
      return 'none';
    }

    // Auto-determine based on operation
    switch (action) {
      case 'view':
        return 'none'; // No linting for view operations
      case 'edit':
        return 'standard'; // Standard linting for edits
      case 'analyze':
        return 'thorough'; // Thorough for explicit analysis
      case 'run':
        return 'fast'; // Quick check before running
      default:
        return 'fast'; // Safe default
    }
  }

  /**
   * Check if linting should run for this request
   */
  private shouldRunLinting(
    lintLevel: LintLevel,
    filePath?: string
  ): boolean {
    // Skip if level is none
    if (lintLevel === 'none') {
      return false;
    }

    // Skip if no file path
    if (!filePath) {
      return false;
    }

    // Skip if not an .ahk file
    if (!filePath.toLowerCase().endsWith('.ahk')) {
      return false;
    }

    return true;
  }

  /**
   * Run code quality check with caching
   */
  private async runCodeQualityCheck(
    filePath: string,
    lintLevel: LintLevel,
    context: OrchestrationContext
  ): Promise<CodeQualityReport | null> {
    if (!this.shouldRunLinting(lintLevel, filePath)) {
      return null;
    }

    try {
      const startTime = Date.now();

      // Run analysis
      const report = await codeQualityManager.analyzeFile(filePath, {
        level: lintLevel,
        includeStructure: lintLevel !== 'fast'
      });

      const duration = Date.now() - startTime;

      // Log for debugging
      if (context.debugFormatter) {
        context.debugFormatter.addEntry({
          tool: 'CodeQualityCheck',
          reason: `Ran ${lintLevel} analysis (${report.cached ? 'cached' : 'fresh'})`,
          duration,
          metadata: {
            errors: report.errors.length,
            warnings: report.warnings.length,
            cached: report.cached
          }
        });
      }

      // Track cache hits
      if (report.cached) {
        context.cacheHits++;
      }

      logger.debug(`Code quality check for ${filePath}: ${report.errors.length} errors, ${report.warnings.length} warnings (${duration}ms, ${report.cached ? 'cached' : 'fresh'})`);

      return report;
    } catch (error) {
      logger.warn(`Code quality check failed for ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Schedule background thorough analysis (non-blocking)
   */
  private scheduleBackgroundLinting(filePath: string, context: OrchestrationContext): void {
    // Don't block - run in background
    setImmediate(async () => {
      try {
        logger.debug(`Starting background thorough analysis for ${filePath}`);

        const report = await codeQualityManager.analyzeFile(filePath, {
          level: 'thorough',
          includeStructure: true
        });

        // Log interesting findings
        if (report.errors.length > 0 || report.warnings.length > 5) {
          logger.info(`Background lint for ${filePath}: ${report.errors.length} errors, ${report.warnings.length} warnings`);
        } else {
          logger.debug(`Background lint for ${filePath}: No significant issues found`);
        }
      } catch (error) {
        logger.debug(`Background lint failed for ${filePath}:`, error);
      }
    });
  }

  /**
   * Format code quality report into concise summary
   */
  private formatCodeQualitySummary(report: CodeQualityReport): string {
    let summary = '\n\n---\n\n## 🔍 Code Quality\n\n';

    // Error summary
    if (report.errors.length === 0) {
      summary += '✅ **No Errors**\n';
    } else {
      summary += `❌ **${report.errors.length} Error(s)**\n`;
      // Show first 3 errors
      for (const error of report.errors.slice(0, 3)) {
        summary += `- Line ${error.line}: ${error.message}\n`;
      }
      if (report.errors.length > 3) {
        summary += `- ... and ${report.errors.length - 3} more\n`;
      }
    }

    // Warning summary
    if (report.warnings.length > 0) {
      summary += `\n⚠️ **${report.warnings.length} Warning(s)**\n`;
      // Show first 2 warnings
      if (report.warnings.length <= 3) {
        for (const warning of report.warnings) {
          summary += `- Line ${warning.line}: ${warning.message}\n`;
        }
      } else {
        for (const warning of report.warnings.slice(0, 2)) {
          summary += `- Line ${warning.line}: ${warning.message}\n`;
        }
        summary += `- ... and ${report.warnings.length - 2} more\n`;
      }
    }

    // Suggestion summary
    if (report.suggestions.length > 0) {
      summary += `\n💡 **${report.suggestions.length} Suggestion(s)**\n`;
    }

    // Code metrics if available
    if (report.structure && report.structure.metrics) {
      const metrics = report.structure.metrics;
      summary += `\n📊 **Metrics**:\n`;
      summary += `- Complexity: ${metrics.complexity}\n`;
      summary += `- Maintainability: ${metrics.maintainability}/100\n`;
      summary += `- Lines of Code: ${metrics.linesOfCode}\n`;
    }

    // Analysis metadata
    summary += `\n*Analysis: ${report.level} level (${report.duration}ms${report.cached ? ', cached' : ''})*\n`;

    return summary;
  }

  /**
   * Get cached result if valid
   */
  getCachedResult<T = any>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    // Check file modification time if available
    if (entry.fileMtime && entry.data.metadata?.lastModified) {
      if (entry.fileMtime !== entry.data.metadata.lastModified) {
        this.cache.delete(key);
        return undefined;
      }
    }

    return entry.data;
  }

  /**
   * Set cached result with TTL
   */
  async setCachedResult(key: string, result: any, ttl: number = this.defaultTTL): Promise<void> {
    let fileMtime: number | undefined;
    
    // Get file modification time if this is file analysis
    if (result.metadata?.filePath) {
      try {
        const stats = await fs.stat(result.metadata.filePath);
        fileMtime = stats.mtime.getTime();
      } catch {
        // File might not exist or be accessible
      }
    }

    const entry: CacheEntry = {
      data: result,
      timestamp: Date.now(),
      fileMtime,
      ttl
    };

    this.cache.set(key, entry);
  }

  /**
   * Execute the optimal tool chain based on intent
   */
  private async executeToolChain(
    intent: OrchestrationIntent,
    context: OrchestrationContext,
    request: OrchestrationRequest
  ): Promise<{ content: any[] }> {
    const toolStartTime = Date.now();
    
    // Step 1: File Detection (if needed)
    let filePath = intent.targetFile;
    if (!filePath) {
      const detectTool = this.toolFactory.createAutoFileTool();
      const detectResult = await detectTool.execute({
        text: request.intent,
        autoSet: false
      });
      
      context.toolCalls++;
      
      if (detectResult.content && detectResult.content.length > 0) {
        const detectedPath = this.extractFilePathFromResult(detectResult);
        if (detectedPath) {
          filePath = detectedPath;
          intent.targetFile = filePath;
        }
      }
      
      if (context.debugFormatter) {
        context.debugFormatter.addEntry({
          tool: 'AHK_File_Detect',
          reason: filePath ? 'File detected from intent' : 'No file found in intent',
          duration: Date.now() - toolStartTime,
          cacheStatus: 'N/A',
          metadata: { detectedPath: filePath }
        });
      }
      
      if (!filePath) {
        throw new Error('Could not auto-detect file. No .ahk file references found in intent.');
      }
    }

    // Step 2: Check cache or analyze file
    const cacheKey = `analysis:${filePath}`;
    let analysis: FileAnalysisResult | undefined;
    
    if (!request.forceRefresh) {
      analysis = this.getCachedResult<FileAnalysisResult>(cacheKey);
      if (analysis) {
        context.cacheHits++;
      }
    }

    if (!analysis) {
      const analyzeStartTime = Date.now();
      const analyzeTool = this.toolFactory.createAnalyzeTool();
      const analyzeResult = await analyzeTool.execute({
        code: await this.readFileContent(filePath),
        includeDocumentation: true,
        includeUsageExamples: false,
        analyzeComplexity: false
      });
      
      context.toolCalls++;
      
      // Parse analysis result into our structure
      analysis = this.parseAnalysisResult(analyzeResult, filePath);
      await this.setCachedResult(cacheKey, analysis);
      
      if (context.debugFormatter) {
        context.debugFormatter.addEntry({
          tool: 'AHK_Analyze',
          reason: 'File analysis completed',
          duration: Date.now() - analyzeStartTime,
          cacheStatus: 'MISS',
          metadata: { 
            classes: analysis.classes.length,
            functions: analysis.functions.length,
            lines: analysis.metadata.lineCount
          }
        });
      }
    } else if (context.debugFormatter) {
      context.debugFormatter.addEntry({
        tool: 'AHK_Analyze',
        reason: 'Using cached analysis',
        duration: 0,
        cacheStatus: 'HIT'
      });
    }

    // Step 3: Handle analyze-only operation
    if (intent.action === 'analyze') {
      return {
        content: [{
          type: 'text',
          text: this.formatAnalysisOutput(analysis, filePath, context)
        }]
      };
    }

    // Step 4: Find target entity and determine line range
    let lineRange = { start: 1, end: analysis.metadata.lineCount };
    let targetInfo = '';
    
    if (intent.targetEntity) {
      const entity = this.findEntity(analysis, intent.targetEntity);
      if (!entity) {
        const availableEntities = this.getAvailableEntities(analysis);
        throw new Error(
          `Target entity '${intent.targetEntity}' not found in file.\n` +
          `Available entities: ${availableEntities.join(', ')}`
        );
      }
      lineRange = { start: entity.startLine, end: entity.endLine };
      targetInfo = `${intent.targetEntity} (lines ${entity.startLine}-${entity.endLine})`;
    }

    // Step 5: View file content
    const viewStartTime = Date.now();
    const viewTool = this.toolFactory.createFileViewTool();
    const viewResult = await viewTool.execute({
      file: filePath,
      lineStart: lineRange.start,
      lineEnd: lineRange.end,
      mode: 'structured',
      maxLines: 100,
      showLineNumbers: true,
      showMetadata: true,
      highlightSyntax: true,
      showStructure: true
    });
    
    context.toolCalls++;
    
    if (context.debugFormatter) {
      context.debugFormatter.addEntry({
        tool: 'AHK_File_View',
        reason: targetInfo ? `Viewing ${targetInfo}` : 'Viewing entire file',
        duration: Date.now() - viewStartTime,
        cacheStatus: 'N/A',
        metadata: { 
          lineRange: `${lineRange.start}-${lineRange.end}`,
          lines: lineRange.end - lineRange.start + 1
        }
      });
    }

    // Step 6: Set active file if editing
    if (intent.action === 'edit') {
      const activeStartTime = Date.now();
      const activeTool = this.toolFactory.createActiveFileTool();
      await activeTool.execute({
        action: 'set',
        filePath: filePath
      });
      
      context.toolCalls++;
      context.activeFile = filePath;
      
      if (context.debugFormatter) {
        context.debugFormatter.addEntry({
          tool: 'AHK_File_Active',
          reason: 'Set active file for editing',
          duration: Date.now() - activeStartTime,
          cacheStatus: 'N/A',
          metadata: { activeFile: filePath }
        });
      }
    }

    // Format final output
    const output = this.formatOrchestrationOutput(
      viewResult,
      filePath,
      targetInfo,
      context,
      analysis
    );

    return { content: [{ type: 'text', text: output }] };
  }

  /**
   * Read file content safely
   */
  private async readFileContent(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract file path from tool result
   */
  private extractFilePathFromResult(result: any): string | undefined {
    if (result.content && result.content.length > 0) {
      const text = result.content[0].text;
      const pathMatch = text.match(/([a-zA-Z]:\\[^:\n]+\.ahk)/);
      return pathMatch ? pathMatch[1] : undefined;
    }
    return undefined;
  }

  /**
   * Parse analysis result into structured format
   */
  private parseAnalysisResult(result: any, filePath: string): FileAnalysisResult {
    // Default structure
    const analysis: FileAnalysisResult = {
      classes: [],
      functions: [],
      hotkeys: [],
      metadata: {
        lineCount: 0,
        lastModified: Date.now()
      }
    };

    // Try to extract structured data from result
    if (result.content && result.content.length > 0) {
      try {
        const data = JSON.parse(result.content[0].text);
        
        // Extract classes
        if (data.classes) {
          analysis.classes = data.classes.map((cls: any) => ({
            name: cls.name || 'Unknown',
            startLine: cls.startLine || 1,
            endLine: cls.endLine || 1,
            methods: cls.methods || []
          }));
        }
        
        // Extract functions
        if (data.functions) {
          analysis.functions = data.functions.map((fn: any) => ({
            name: fn.name || 'Unknown',
            startLine: fn.startLine || 1,
            endLine: fn.endLine || 1
          }));
        }
        
        // Extract metadata
        if (data.metadata) {
          analysis.metadata = {
            lineCount: data.metadata.lineCount || 0,
            lastModified: data.metadata.lastModified || Date.now()
          };
        }
      } catch {
        // If parsing fails, leave defaults
      }
    }

    // Add file path to metadata
    analysis.metadata.filePath = filePath;
    
    return analysis;
  }

  /**
   * Find entity in analysis
   */
  private findEntity(analysis: FileAnalysisResult, entityName: string): { startLine: number; endLine: number } | undefined {
    // Check for class.method pattern
    if (entityName.includes('.')) {
      const [className, methodName] = entityName.split('.');
      const cls = analysis.classes.find(c => c.name === className);
      if (cls) {
        const method = cls.methods.find(m => m.name === methodName);
        if (method) {
          return { startLine: method.startLine, endLine: method.endLine };
        }
      }
    }
    
    // Check for class
    const cls = analysis.classes.find(c => c.name === entityName);
    if (cls) {
      return { startLine: cls.startLine, endLine: cls.endLine };
    }
    
    // Check for function
    const fn = analysis.functions.find(f => f.name === entityName);
    if (fn) {
      return { startLine: fn.startLine, endLine: fn.endLine };
    }
    
    return undefined;
  }

  /**
   * Get list of available entities for error messages
   */
  private getAvailableEntities(analysis: FileAnalysisResult): string[] {
    const entities: string[] = [];
    
    // Add classes
    analysis.classes.forEach(cls => {
      entities.push(cls.name);
      // Add class.methods
      cls.methods.forEach(method => {
        entities.push(`${cls.name}.${method.name}`);
      });
    });
    
    // Add functions
    analysis.functions.forEach(fn => {
      entities.push(fn.name);
    });
    
    return entities;
  }

  /**
   * Format analysis output for analyze-only operation
   */
  private formatAnalysisOutput(analysis: FileAnalysisResult, filePath: string, context: OrchestrationContext): string {
    let output = `📋 **File Structure Analysis**\n\n`;
    output += `⚡ Performance: ${context.toolCalls} tool call(s) | Cache: ${context.cacheHits > 0 ? 'HIT ⚡' : 'MISS'}\n`;
    output += `📁 File: ${filePath}\n\n`;
    
    if (analysis.classes.length > 0) {
      output += `📚 **Classes (${analysis.classes.length}):**\n`;
      analysis.classes.forEach(cls => {
        output += `  • ${cls.name} (lines ${cls.startLine}-${cls.endLine})\n`;
      });
      output += '\n';
    }
    
    if (analysis.functions.length > 0) {
      output += `⚡ **Functions (${analysis.functions.length}):**\n`;
      analysis.functions.forEach(fn => {
        output += `  • ${fn.name} (lines ${fn.startLine}-${fn.endLine})\n`;
      });
      output += '\n';
    }
    
    output += `**Next Steps:**\n`;
    output += `• Use targetEntity parameter to view specific class/function\n`;
    output += `• Use operation: "view" to read file content\n`;
    
    return output;
  }

  /**
   * Format final orchestration output
   */
  private formatOrchestrationOutput(
    viewResult: any,
    filePath: string,
    targetInfo: string,
    context: OrchestrationContext,
    analysis: FileAnalysisResult
  ): string {
    let output = `🎯 **Smart Orchestrator Results**\n\n`;
    output += `⚡ Performance: ${context.toolCalls} tool call(s) | Cache: ${context.cacheHits > 0 ? 'HIT ⚡' : 'MISS'}\n`;
    output += `📁 File: ${filePath}\n`;
    
    if (targetInfo) {
      output += `🎯 Target: ${targetInfo}\n`;
    }
    
    if (context.cacheHits > 0) {
      output += `💾 Cache age: ${Math.floor((Date.now() - analysis.metadata.lastModified) / 1000)}s\n`;
    }
    
    output += '\n---\n\n';
    
    // Add the actual content
    if (viewResult.content && viewResult.content.length > 0) {
      output += viewResult.content[0].text;
    }
    
    // Add next steps for edit operations
    if (context.activeFile) {
      output += '\n\n**Next Steps:**\n';
      output += '• Use AHK_File_Edit to modify the code\n';
      output += '• File is set as active for editing\n';
    }
    
    return output;
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: Array<{ key: string; age: number; ttl: number }> } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: Date.now() - entry.timestamp,
      ttl: entry.ttl
    }));
    
    return {
      size: this.cache.size,
      entries
    };
  }
}