import logger from '../logger.js';
import {
  orchestrationContext,
  FileAnalysisResult,
  ClassInfo,
  MethodInfo,
  FunctionInfo,
  HotkeyInfo,
  LineRange,
  OrchestrationContext,
  OperationRecord,
} from './orchestration-context.js';
import { AhkAutoFileTool } from '../tools/ahk-file-detect.js';
import { AhkAnalyzeTool } from '../tools/ahk-analyze-code.js';
import { AhkFileViewTool } from '../tools/ahk-file-view.js';
import { AhkFileTool } from '../tools/ahk-file-active.js';
import { promises as fs } from 'fs';

export interface OrchestrationRequest {
  intent: string;
  filePath?: string;
  targetEntity?: string;
  operation: 'view' | 'edit' | 'analyze';
  forceRefresh?: boolean;
}

export interface OrchestrationResult {
  success: boolean;
  toolCallsMade: number;
  cacheHit: boolean;
  context: string;
  nextSteps: string[];
  errors?: string[];
  metadata: {
    filePath: string;
    targetEntity?: string;
    linesRead?: LineRange;
    analysisAge?: number;
  };
}

export class OrchestrationEngine {
  private detectTool: AhkAutoFileTool;
  private analyzeTool: AhkAnalyzeTool;
  private viewTool: AhkFileViewTool;
  private fileTool: AhkFileTool;

  constructor() {
    this.detectTool = new AhkAutoFileTool();
    this.analyzeTool = new AhkAnalyzeTool();
    this.viewTool = new AhkFileViewTool();
    this.fileTool = new AhkFileTool();
  }

  async orchestrate(request: OrchestrationRequest): Promise<OrchestrationResult> {
    const startTime = Date.now();
    let toolCallsMade = 0;
    let cacheHit = false;
    const toolsCalled: string[] = [];

    try {
      // Step 1: Determine file path
      let filePath = request.filePath;
      if (!filePath) {
        logger.info('No file path provided, attempting detection');
        const detectResult = await this.detectTool.execute({
          text: request.intent,
          autoSet: false,
        });
        toolCallsMade++;
        toolsCalled.push('AHK_File_Detect');

        const detectText = detectResult.content[0]?.text || '';
        const extractedPath = this.extractFilePathFromDetection(detectText);

        if (!extractedPath) {
          return this.errorResult(
            ['File detection failed. Please provide explicit filePath parameter.'],
            toolCallsMade,
            { filePath: '' }
          );
        }
        filePath = extractedPath;
      }

      // Step 2: Get or create analysis
      let analysis: FileAnalysisResult | null = null;
      let ctx = orchestrationContext.get(filePath);

      const isStale = ctx ? await orchestrationContext.isStale(filePath) : false;

      if (ctx && !isStale && !request.forceRefresh) {
        // Cache hit
        cacheHit = true;
        analysis = ctx.analysisResult;
        logger.info(`Using cached analysis for ${filePath}`);
      } else {
        // Cache miss or stale - analyze file
        if (isStale) {
          logger.info(`Cache stale for ${filePath}, re-analyzing`);
          orchestrationContext.invalidate(filePath);
        }

        logger.info(`Analyzing file: ${filePath}`);
        const analyzeResult = await this.analyzeTool.execute({
          code: filePath,
          includeDocumentation: false,
          includeUsageExamples: false,
          analyzeComplexity: false,
        });
        toolCallsMade++;
        toolsCalled.push('AHK_Analyze');

        analysis = this.parseAnalysisResult(analyzeResult.content[0]?.text || '', filePath);

        // Update cache
        const stats = await fs.stat(filePath);
        ctx = {
          filePath,
          analysisResult: analysis,
          analysisTimestamp: Date.now(),
          fileModifiedTime: stats.mtimeMs,
          operationHistory: [],
        };
        orchestrationContext.set(filePath, ctx);
      }

      if (!analysis) {
        return this.errorResult(['Failed to analyze file structure'], toolCallsMade, { filePath });
      }

      // Step 3: Handle based on operation type
      if (request.operation === 'analyze') {
        // Just return analysis structure
        const result = this.formatAnalysisOnly(analysis, toolCallsMade, cacheHit);
        this.recordOperation(
          filePath,
          'analyze',
          toolsCalled,
          Date.now() - startTime,
          cacheHit,
          true
        );
        return result;
      }

      // Step 4: Find target entity if specified
      let lineRange: LineRange | null = null;
      if (request.targetEntity) {
        lineRange = this.findEntityRange(analysis, request.targetEntity);
        if (!lineRange) {
          return this.errorResult(
            [
              `Target entity '${request.targetEntity}' not found in file`,
              `Available entities: ${this.listAvailableEntities(analysis)}`,
            ],
            toolCallsMade,
            { filePath, targetEntity: request.targetEntity }
          );
        }
      } else {
        // No target specified - use entire file or first class
        if (analysis.classes.length > 0) {
          const firstClass = analysis.classes[0];
          lineRange = { start: firstClass.startLine, end: firstClass.endLine };
        } else {
          lineRange = analysis.globalLines;
        }
      }

      // Step 5: Read file content
      logger.info(`Reading lines ${lineRange.start}-${lineRange.end} from ${filePath}`);
      const viewResult = await this.viewTool.execute({
        file: filePath,
        lineStart: lineRange.start,
        lineEnd: lineRange.end,
        mode: 'structured',
        maxLines: lineRange.end - lineRange.start + 1,
        showLineNumbers: true,
        showMetadata: true,
        highlightSyntax: false,
        showStructure: true,
      });
      toolCallsMade++;
      toolsCalled.push('AHK_File_View');

      const content = viewResult.content[0]?.text || '';

      // Step 6: Set active file if edit mode
      if (request.operation === 'edit') {
        await this.fileTool.execute({ action: 'set', path: filePath });
        toolCallsMade++;
        toolsCalled.push('AHK_File_Active');
      }

      // Record operation
      this.recordOperation(
        filePath,
        request.operation,
        toolsCalled,
        Date.now() - startTime,
        cacheHit,
        true
      );

      // Step 7: Format result
      return this.formatSuccessResult(
        content,
        toolCallsMade,
        cacheHit,
        filePath,
        request.targetEntity,
        lineRange,
        ctx.analysisTimestamp,
        request.operation
      );
    } catch (error) {
      logger.error('Orchestration error:', error);
      return this.errorResult(
        [error instanceof Error ? error.message : String(error)],
        toolCallsMade,
        { filePath: request.filePath || '' }
      );
    }
  }

  private extractFilePathFromDetection(detectText: string): string | null {
    // Parse detection result to extract file path
    const pathMatch = detectText.match(/(?:File|Path):\s*(.+\.ahk)/i);
    if (pathMatch) {
      return pathMatch[1].trim();
    }
    return null;
  }

  private parseAnalysisResult(analysisText: string, filePath: string): FileAnalysisResult {
    // Parse AHK_Analyze output into structured result
    const classes: ClassInfo[] = [];
    const functions: FunctionInfo[] = [];
    const hotkeys: HotkeyInfo[] = [];

    // Simple parsing logic (can be enhanced based on actual AHK_Analyze output format)
    const classMatches = analysisText.matchAll(/class\s+(\w+).*?lines?\s+(\d+)-(\d+)/gi);
    for (const match of classMatches) {
      classes.push({
        name: match[1],
        startLine: parseInt(match[2]),
        endLine: parseInt(match[3]),
        methods: [],
        properties: [],
      });
    }

    const funcMatches = analysisText.matchAll(/function\s+(\w+).*?lines?\s+(\d+)-(\d+)/gi);
    for (const match of funcMatches) {
      functions.push({
        name: match[1],
        startLine: parseInt(match[2]),
        endLine: parseInt(match[3]),
      });
    }

    return {
      filePath,
      classes,
      functions,
      hotkeys,
      globalLines: { start: 1, end: 1000 }, // Default, can be improved
    };
  }

  private findEntityRange(analysis: FileAnalysisResult, targetEntity: string): LineRange | null {
    // Handle "ClassName.MethodName" format
    if (targetEntity.includes('.')) {
      const [className, methodName] = targetEntity.split('.');
      const cls = analysis.classes.find(c => c.name === className);
      if (!cls) return null;

      const method = cls.methods.find(m => m.name === methodName);
      if (!method) return null;

      return { start: method.startLine, end: method.endLine };
    }

    // Check classes
    const cls = analysis.classes.find(c => c.name === targetEntity);
    if (cls) {
      return { start: cls.startLine, end: cls.endLine };
    }

    // Check functions
    const func = analysis.functions.find(f => f.name === targetEntity);
    if (func) {
      return { start: func.startLine, end: func.endLine };
    }

    return null;
  }

  private listAvailableEntities(analysis: FileAnalysisResult): string {
    const entities: string[] = [];
    entities.push(...analysis.classes.map(c => c.name));
    entities.push(...analysis.functions.map(f => f.name));
    return entities.join(', ') || 'None';
  }

  private formatAnalysisOnly(
    analysis: FileAnalysisResult,
    toolCallsMade: number,
    cacheHit: boolean
  ): OrchestrationResult {
    const lines: string[] = [
      '**File Structure Analysis**\n',
      `Performance: ${toolCallsMade} tool call(s) | Cache: ${cacheHit ? 'HIT' : 'MISS'}`,
      `File: ${analysis.filePath}\n`,
    ];

    if (analysis.classes.length > 0) {
      lines.push(`**Classes (${analysis.classes.length}):**`);
      analysis.classes.forEach(cls => {
        lines.push(`• ${cls.name} (lines ${cls.startLine}-${cls.endLine})`);
      });
      lines.push('');
    }

    if (analysis.functions.length > 0) {
      lines.push(`**Functions (${analysis.functions.length}):**`);
      analysis.functions.forEach(fn => {
        lines.push(`• ${fn.name} (lines ${fn.startLine}-${fn.endLine})`);
      });
      lines.push('');
    }

    return {
      success: true,
      toolCallsMade,
      cacheHit,
      context: lines.join('\n'),
      nextSteps: [
        'Use targetEntity parameter to view specific class/function',
        'Use operation: "view" to read file content',
        'Use operation: "edit" to prepare for editing',
      ],
      metadata: { filePath: analysis.filePath },
    };
  }

  private formatSuccessResult(
    content: string,
    toolCallsMade: number,
    cacheHit: boolean,
    filePath: string,
    targetEntity: string | undefined,
    linesRead: LineRange,
    analysisTimestamp: number,
    operation: string
  ): OrchestrationResult {
    const analysisAge = Date.now() - analysisTimestamp;

    const lines: string[] = [
      '**Smart Orchestrator Results**\n',
      `Performance: ${toolCallsMade} tool call(s) | Cache: ${cacheHit ? 'HIT' : 'MISS'}`,
      `File: ${filePath}`,
      targetEntity ? `Target: ${targetEntity} (lines ${linesRead.start}-${linesRead.end})` : '',
      cacheHit ? `Cache age: ${Math.round(analysisAge / 1000)}s` : '',
      '\n---\n',
      content,
    ];

    const nextSteps: string[] = [];
    if (operation === 'edit') {
      nextSteps.push('Use AHK_File_Edit to modify the code');
      nextSteps.push('File is set as active for editing');
    } else {
      nextSteps.push('Use operation: "edit" to prepare for editing');
      nextSteps.push('Use AHK_File_Edit_Advanced for complex modifications');
    }

    return {
      success: true,
      toolCallsMade,
      cacheHit,
      context: lines.filter(l => l).join('\n'),
      nextSteps,
      metadata: {
        filePath,
        targetEntity,
        linesRead,
        analysisAge,
      },
    };
  }

  private errorResult(
    errors: string[],
    toolCallsMade: number,
    metadata: { filePath: string; targetEntity?: string }
  ): OrchestrationResult {
    return {
      success: false,
      toolCallsMade,
      cacheHit: false,
      context: '',
      nextSteps: [],
      errors,
      metadata,
    };
  }

  private recordOperation(
    filePath: string,
    operation: string,
    toolsCalled: string[],
    duration: number,
    cacheHit: boolean,
    success: boolean
  ): void {
    const ctx = orchestrationContext.get(filePath);
    if (!ctx) return;

    const record: OperationRecord = {
      timestamp: Date.now(),
      operation,
      toolsCalled,
      duration,
      cacheHit,
      success,
    };

    ctx.operationHistory.push(record);
    orchestrationContext.set(filePath, ctx);
  }
}
