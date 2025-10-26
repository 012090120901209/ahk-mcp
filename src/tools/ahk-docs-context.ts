import { z } from 'zod';
import { getAhkIndex, getAhkDocumentationFull } from '../core/loader.js';
import logger from '../logger.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { safeParse } from '../core/validation-middleware.js';

export const AhkContextInjectorArgsSchema = z.object({
  userPrompt: z.string().min(1, 'User prompt is required'),
  llmThinking: z.string().optional(),
  contextType: z.enum(['auto', 'functions', 'variables', 'classes', 'methods']).optional().default('auto'),
  maxItems: z.number().min(1).max(10).optional().default(5),
  includeModuleInstructions: z.boolean().optional().default(true)
});

export const ahkContextInjectorToolDefinition = {
  name: 'AHK_Context_Injector',
  description: `Ahk context injector
Analyzes user prompts and LLM thinking to automatically inject relevant AutoHotkey v2 documentation context.`,
  inputSchema: {
    type: 'object',
    properties: {
      userPrompt: {
        type: 'string',
        description: 'User prompt is required'
      },
      llmThinking: {
        type: 'string',
        description: 'Optional LLM thinking content'
      },
      contextType: {
        type: 'string',
        enum: ['auto', 'functions', 'variables', 'classes', 'methods'],
        description: 'Type of context to inject',
        default: 'auto'
      },
      maxItems: {
        type: 'number',
        minimum: 1,
        maximum: 10,
        description: 'Maximum number of context items to return',
        default: 5
      },
      includeModuleInstructions: {
        type: 'boolean',
        description: 'Include relevant AHK v2 instruction modules',
        default: true
      }
    },
    required: ['userPrompt']
  }
};

interface ContextMatch {
  type: string;
  name: string;
  description: string;
  relevance: number;
  data: any;
}

export class AhkContextInjectorTool {
  private keywordMap: Map<string, string[]> = new Map();
  private moduleInstructionsCache: Map<string, string> = new Map();
  private moduleKeywordMap: Map<string, string[]> = new Map();

  constructor() {
    this.initializeKeywordMap();
    this.initializeModuleKeywordMap();
  }

  private initializeKeywordMap(): void {
    // Map common concepts to AutoHotkey elements
    this.keywordMap.set('clipboard', ['A_Clipboard', 'OnClipboardChange', 'ClipboardAll']);
    this.keywordMap.set('gui', ['Gui', 'GuiCreate', 'Show', 'Add']);
    this.keywordMap.set('window', ['WinActivate', 'WinExist', 'WinGetTitle', 'A_WinDir']);
    this.keywordMap.set('file', ['FileRead', 'FileWrite', 'FileAppend', 'A_WorkingDir']);
    this.keywordMap.set('hotkey', ['Hotkey', 'Send', 'SendText', 'SendInput']);
    this.keywordMap.set('string', ['StrSplit', 'StrReplace', 'SubStr', 'StrLen']);
    this.keywordMap.set('array', ['Array', 'Push', 'Pop', 'Length']);
    this.keywordMap.set('map', ['Map', 'Set', 'Get', 'Has']);
    this.keywordMap.set('loop', ['loop', 'Loop', 'For', 'While']);
    this.keywordMap.set('message', ['MsgBox', 'ToolTip', 'TrayTip']);
    this.keywordMap.set('monitor', ['A_ScreenWidth', 'A_ScreenHeight', 'MonitorGet']);
    this.keywordMap.set('mouse', ['Click', 'MouseMove', 'A_Cursor']);
    this.keywordMap.set('keyboard', ['Send', 'SendText', 'GetKeyState']);
    this.keywordMap.set('time', ['A_Now', 'A_TickCount', 'Sleep']);
    this.keywordMap.set('toggle', ['if', 'else', 'Boolean']);

    // File editing triggers
    this.keywordMap.set('edit', ['AHK_File_Edit_Advanced', 'AHK_File_Edit', 'AHK_File_Active']);
    this.keywordMap.set('modify', ['AHK_File_Edit_Advanced', 'AHK_File_Edit', 'AHK_File_Active']);
    this.keywordMap.set('change', ['AHK_File_Edit_Advanced', 'AHK_File_Edit', 'AHK_File_Active']);
    this.keywordMap.set('update', ['AHK_File_Edit_Advanced', 'AHK_File_Edit', 'AHK_File_Active']);
    this.keywordMap.set('fix', ['AHK_File_Edit_Advanced', 'AHK_File_Edit', 'AHK_Diagnostics']);
  }

  private initializeModuleKeywordMap(): void {
    // Map keywords to AHK instruction modules based on Module_Instructions.md
    this.moduleKeywordMap.set('Module_Arrays.md', [
      'array', 'list', 'collection', 'filter', 'map', 'reduce', 'sort', 'unique',
      'flatten', 'iterate', 'batch', 'for each item'
    ]);

    this.moduleKeywordMap.set('Module_Classes.md', [
      'class', 'inheritance', 'extends', 'super', '__New', '__Delete', 'static',
      'nested class', 'factory', 'oop', 'object oriented'
    ]);

    this.moduleKeywordMap.set('Module_Objects.md', [
      'object', 'property', 'descriptor', 'DefineProp', 'HasProp', 'HasMethod',
      'bound', 'bind', 'callback'
    ]);

    this.moduleKeywordMap.set('Module_GUI.md', [
      'gui', 'window', 'form', 'dialog', 'button', 'control', 'layout', 'position',
      'xm', 'section', 'OnEvent', 'window with controls', 'handle events'
    ]);

    this.moduleKeywordMap.set('Module_TextProcessing.md', [
      'string', 'text', 'escape', 'quote', 'regex', 'pattern', 'match', 'replace',
      'split', 'join', '`n', 'validate input'
    ]);

    this.moduleKeywordMap.set('Module_DynamicProperties.md', [
      '=>', 'fat arrow', 'lambda', 'closure', 'dynamic property', '__Get', '__Set', '__Call'
    ]);

    this.moduleKeywordMap.set('Module_Errors.md', [
      'error', 'wrong', 'broken', 'fail', 'syntax error', 'runtime error', 'undefined',
      'not working', 'v1 to v2', 'debug', 'fix', 'troubleshoot'
    ]);

    this.moduleKeywordMap.set('Module_ClassPrototyping.md', [
      'prototyping', 'class generator', 'runtime class', 'property descriptor', 'CreateClass'
    ]);

    this.moduleKeywordMap.set('Module_DataStructures.md', [
      'map', 'key-value', 'dictionary', 'storage', 'settings', 'configuration', 'cache',
      'store multiple values'
    ]);
  }

  /**
   * Read and cache AHK v2 instruction modules from docs/Modules directory
   */
  private async loadModuleInstructions(moduleFile: string): Promise<string | null> {
    try {
      // Check cache first
      if (this.moduleInstructionsCache.has(moduleFile)) {
        return this.moduleInstructionsCache.get(moduleFile)!;
      }

      // Determine project root - look for package.json to find root
      const currentDir = process.cwd();
      let projectRoot = currentDir;

      // Try to find project root by looking for package.json
      while (projectRoot !== path.dirname(projectRoot)) {
        try {
          await fs.access(path.join(projectRoot, 'package.json'));
          break;
        } catch {
          projectRoot = path.dirname(projectRoot);
        }
      }

      const moduleFilePath = path.join(projectRoot, 'docs', 'Modules', moduleFile);

      try {
        const content = await fs.readFile(moduleFilePath, 'utf-8');
        this.moduleInstructionsCache.set(moduleFile, content);
        logger.info(`Loaded AHK module instructions: ${moduleFile}`);
        return content;
      } catch (error) {
        logger.warn(`Could not load module instructions: ${moduleFile}`, error);
        return null;
      }
    } catch (error) {
      logger.error(`Error loading module instructions: ${moduleFile}`, error);
      return null;
    }
  }

  /**
   * Find relevant AHK instruction modules based on user prompt keywords
   */
  private async findRelevantModules(keywords: string[]): Promise<string[]> {
    const relevantModules: Map<string, number> = new Map();

    // Score modules based on keyword matches
    for (const [moduleFile, moduleKeywords] of this.moduleKeywordMap) {
      let score = 0;

      for (const keyword of keywords) {
        for (const moduleKeyword of moduleKeywords) {
          if (keyword.toLowerCase().includes(moduleKeyword.toLowerCase()) ||
              moduleKeyword.toLowerCase().includes(keyword.toLowerCase())) {
            score += 1;
          }
        }
      }

      if (score > 0) {
        relevantModules.set(moduleFile, score);
      }
    }

    // Sort by relevance and return top modules
    return Array.from(relevantModules.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3) // Limit to top 3 most relevant modules
      .map(([moduleFile]) => moduleFile);
  }

  /**
   * Load and format relevant module instructions
   */
  private async getRelevantModuleInstructions(keywords: string[]): Promise<string> {
    try {
      const relevantModules = await this.findRelevantModules(keywords);

      if (relevantModules.length === 0) {
        return '';
      }

      const moduleContents: string[] = [];

      // Load main module instructions first
      const mainInstructions = await this.loadModuleInstructions('Module_Instructions.md');
      if (mainInstructions) {
        moduleContents.push('## 🎯 AutoHotkey v2 Expert Instructions\n\n' + mainInstructions);
      }

      // Load relevant specific modules
      for (const moduleFile of relevantModules) {
        const content = await this.loadModuleInstructions(moduleFile);
        if (content) {
          const moduleName = moduleFile.replace('Module_', '').replace('.md', '');
          moduleContents.push(`\n## 📋 ${moduleName} Module\n\n${content}`);
        }
      }

      return moduleContents.join('\n\n---\n\n');
    } catch (error) {
      logger.error('Error loading module instructions:', error);
      return '';
    }
  }

  async execute(args: unknown): Promise<any> {
    const parsed = safeParse(args, AhkContextInjectorArgsSchema, 'AHK_Context_Injector');
    if (!parsed.success) return parsed.error;

    try {
      logger.info('Analyzing prompt for AutoHotkey context injection');

      const validatedArgs = parsed.data;
      const { userPrompt, llmThinking, contextType, maxItems, includeModuleInstructions } = validatedArgs;

      // Get both index and full documentation data
      const ahkIndex = getAhkIndex();
      const ahkFullDocs = getAhkDocumentationFull();
      
      if (!ahkIndex && !ahkFullDocs) {
        return {
          content: [
            {
              type: 'text',
              text: 'AutoHotkey documentation not available for context injection.'
            }
          ]
        };
      }

      // Analyze text to extract keywords and concepts
      const combinedText = `${userPrompt} ${llmThinking || ''}`;
      const keywords = this.extractKeywords(combinedText);

      // Get module instructions if requested
      let moduleInstructions = '';
      if (includeModuleInstructions) {
        moduleInstructions = await this.getRelevantModuleInstructions(keywords);
      }

      // Search in both index and full documentation
      const contextMatches = this.findRelevantContextEnhanced(keywords, ahkIndex, ahkFullDocs, contextType, maxItems);

      if (contextMatches.length === 0 && !moduleInstructions) {
        const hasFilePath = this.detectFilePath(combinedText);
        let generalContext = '## 🎯 AutoHotkey v2 General Context\n\n';

        if (hasFilePath) {
          generalContext += '**🚨 FILE PATH DETECTED - USE FILE EDITING TOOLS!**\n\n' +
            '**Primary Action:** Use `AHK_File_Edit_Advanced` tool to set the file as active and get editing guidance\n' +
            '**Follow-up:** Use `AHK_File_Edit` for direct file modifications\n' +
            '**Important:** Always edit the actual file instead of generating code blocks\n\n';
        }

        generalContext += 'Common AutoHotkey v2 patterns:\n\n' +
          '**Basic Syntax:**\n' +
          '- Use `:=` for assignment, `=` for comparison\n' +
          '- Use `Map()` constructor instead of object literals\n' +
          '- Remove "new" keyword when initializing classes\n' +
          '- Use semicolon (;) for comments\n\n' +
          '**Common Variables:**\n' +
          '- `A_Clipboard` - Current clipboard content\n' +
          '- `A_WorkingDir` - Current working directory\n' +
          '- `A_ScriptDir` - Script directory\n' +
          '- `A_ScreenWidth/A_ScreenHeight` - Screen dimensions';

        if (hasFilePath) {
          generalContext += '\n\n**🔧 Available File Editing Tools:**\n' +
            '- `AHK_File_Edit_Advanced` - Primary tool for file operations\n' +
            '- `AHK_File_Edit` - Direct text editing (replace, insert, delete)\n' +
            '- `AHK_File_Active` - Manage active file settings\n' +
            '- `AHK_Run` - Test the edited script';
        }

        return {
          content: [
            {
              type: 'text',
              text: generalContext
            }
          ]
        };
      }

      // Generate enhanced context injection
      let finalText = '';

      // Check for file path detection
      const hasFilePath = this.detectFilePath(combinedText);
      const hasEditingKeywords = keywords.some(k => ['edit', 'modify', 'change', 'update', 'fix'].includes(k));

      // Add file editing guidance if detected
      if (hasFilePath || hasEditingKeywords) {
        finalText += '## 🎯 FILE EDITING DETECTED\n\n';
        finalText += '**🚨 IMPORTANT: Use file editing tools instead of generating code blocks!**\n\n';
        finalText += '**Recommended Workflow:**\n';
        finalText += '1. Use `AHK_File_Edit_Advanced` to set the target file and get editing guidance\n';
        finalText += '2. Use `AHK_File_Edit` for specific text modifications\n';
        finalText += '3. Use `AHK_Run` to test the changes\n\n';
        finalText += '---\n\n';
      }

      // Add module instructions first if available
      if (moduleInstructions) {
        finalText += moduleInstructions + '\n\n---\n\n';
      }

      // Add documentation context if available
      if (contextMatches.length > 0) {
        const contextText = this.generateEnhancedContextText(contextMatches);
        finalText += contextText + '\n\n---\n\n';
      }

      // Add debug information
      const debugInfo = '**Debug Info:**\n' +
        `- Detected Keywords: ${keywords.join(', ')}\n` +
        `- File Path Detected: ${hasFilePath ? 'Yes' : 'No'}\n` +
        `- Editing Keywords: ${hasEditingKeywords ? 'Yes' : 'No'}\n` +
        `- Context Matches: ${contextMatches.length}\n` +
        `- Module Instructions: ${moduleInstructions ? 'Included' : 'None'}\n` +
        `- Sources: ${ahkIndex ? 'Index' : ''}${ahkIndex && ahkFullDocs ? ' + ' : ''}${ahkFullDocs ? 'Full Documentation' : ''}${moduleInstructions ? ' + Module Instructions' : ''}\n` +
        `- Injection Reason: Enhanced context injection with comprehensive AutoHotkey documentation and specialized modules`;

      return {
        content: [
          {
            type: 'text',
            text: finalText + debugInfo
          }
        ]
      };

    } catch (error) {
      logger.error('Error in context injector:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error analyzing context: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }

  private extractKeywords(text: string): string[] {
    const keywords: string[] = [];
    const normalizedText = text.toLowerCase();

    // Check for direct keyword matches
    for (const concept of this.keywordMap.keys()) {
      if (normalizedText.includes(concept)) {
        keywords.push(concept);
      }
    }

    // Extract AutoHotkey-specific terms
    const ahkPatterns = [
      /\b(msgbox|tooltip|send|click|hotkey|gui|window|file|array|map|loop)\b/gi,
      /\b(a_\w+)\b/gi,  // Built-in variables
      /\b(\w+(?:read|write|get|set|show|add|create))\b/gi  // Common function patterns
    ];

    for (const pattern of ahkPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        keywords.push(...matches.map(m => m.toLowerCase()));
      }
    }

    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Detect if the text contains a file path
   */
  private detectFilePath(text: string): boolean {
    // Look for common file path patterns
    const filePathPatterns = [
      /[A-Za-z]:[/\\][^<>:"|?*\r\n]+\.ahk/g, // Windows absolute paths
      /(?:~|\.\.?)[/\\][^<>:"|?*\r\n]+\.ahk/g, // Relative paths
      /[^<>:"|?*\r\n]+\.ahk/g, // Simple .ahk filenames
      /["'][^"']+\.ahk["']/, // Quoted paths
    ];

    return filePathPatterns.some(pattern => pattern.test(text));
  }

  private findRelevantContext(keywords: string[], ahkIndex: any, contextType: string, maxItems: number): ContextMatch[] {
    const matches: ContextMatch[] = [];

    // Search through different categories
    if (contextType === 'auto' || contextType === 'variables') {
      this.searchInCategory(keywords, ahkIndex.variables, 'variable', matches);
    }
    
    if (contextType === 'auto' || contextType === 'functions') {
      this.searchInCategory(keywords, ahkIndex.functions, 'function', matches);
    }
    
    if (contextType === 'auto' || contextType === 'classes') {
      this.searchInCategory(keywords, ahkIndex.classes, 'class', matches);
    }
    
    if (contextType === 'auto' || contextType === 'methods') {
      this.searchInCategory(keywords, ahkIndex.methods, 'method', matches);
    }

    // Sort by relevance and limit results
    return matches
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, maxItems);
  }

  private searchInCategory(keywords: string[], items: any[], category: string, matches: ContextMatch[]): void {
    if (!items) return;

    for (const item of items) {
      const relevance = this.calculateRelevance(keywords, item);
      if (relevance > 0) {
        matches.push({
          type: category,
          name: item.Name,
          description: item.Description || '',
          relevance,
          data: item
        });
      }
    }
  }

  private calculateRelevance(keywords: string[], item: any): number {
    let relevance = 0;
    const itemText = `${item.Name} ${item.Description || ''}`.toLowerCase();

    for (const keyword of keywords) {
      // Direct name match gets highest score
      if (item.Name.toLowerCase().includes(keyword)) {
        relevance += 10;
      }
      // Description match gets medium score
      else if (itemText.includes(keyword)) {
        relevance += 5;
      }
      // Keyword mapping match gets lower score
      else if (this.keywordMap.has(keyword)) {
        const mappedElements = this.keywordMap.get(keyword)!;
        for (const element of mappedElements) {
          if (item.Name.toLowerCase().includes(element.toLowerCase())) {
            relevance += 3;
          }
        }
      }
    }

    return relevance;
  }

  private generateContextText(matches: ContextMatch[]): string {
    let contextText = '## 🎯 Relevant AutoHotkey v2 Context\n\n';
    contextText += '*Automatically injected based on your request:*\n\n';

    const groupedMatches = this.groupMatchesByType(matches);

    for (const [type, items] of Object.entries(groupedMatches)) {
      if (items.length === 0) continue;

      contextText += `### ${this.capitalizeFirst(type)}s\n\n`;

      for (const match of items) {
        contextText += `**${match.name}**: ${match.description}\n`;
        
        // Add examples if available
        if (match.data.Examples && match.data.Examples.length > 0) {
          contextText += `\n*Example:*\n\`\`\`autohotkey\n${match.data.Examples[0].Code}\n\`\`\`\n`;
        }
        
        // Add parameters if available
        if (match.data.Parameters && match.data.Parameters.length > 0) {
          contextText += `\n*Parameters:* ${match.data.Parameters.map((p: any) => p.Name).join(', ')}\n`;
        }
        
        contextText += '\n';
      }
    }

    contextText += '\n*💡 Use this context to write more accurate AutoHotkey v2 code.*\n';
    
    return contextText;
  }

  private groupMatchesByType(matches: ContextMatch[]): Record<string, ContextMatch[]> {
    const grouped: Record<string, ContextMatch[]> = {};
    
    for (const match of matches) {
      if (!grouped[match.type]) {
        grouped[match.type] = [];
      }
      grouped[match.type].push(match);
    }
    
    return grouped;
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Enhanced search that uses both index and full documentation
   */
  private findRelevantContextEnhanced(keywords: string[], ahkIndex: any, ahkFullDocs: any, contextType: string, maxItems: number): ContextMatch[] {
    const matches: ContextMatch[] = [];

    // Search in full documentation first (more comprehensive)
    if (ahkFullDocs && ahkFullDocs.data) {
      this.searchInFullDocumentation(keywords, ahkFullDocs.data, contextType, matches);
    }

    // Fallback to index if full docs not available or insufficient matches
    if (matches.length < maxItems && ahkIndex) {
      this.searchInIndexData(keywords, ahkIndex, contextType, matches);
    }

    // Sort by relevance and limit results
    return matches
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, maxItems);
  }

  /**
   * Search through the comprehensive full documentation
   */
  private searchInFullDocumentation(keywords: string[], fullDocsData: any, contextType: string, matches: ContextMatch[]): void {
    // Search Built-in Variables
    if ((contextType === 'auto' || contextType === 'variables') && fullDocsData.BuiltInVariables) {
      for (const item of fullDocsData.BuiltInVariables) {
        const relevance = this.calculateEnhancedRelevance(keywords, item);
        if (relevance > 0) {
          matches.push({
            type: 'variable',
            name: item.Name,
            description: item.Description || '',
            relevance,
            data: {
              ...item,
              source: 'full_docs',
              returnType: item.ReturnType,
              parameters: item.Parameters
            }
          });
        }
      }
    }

    // Search Classes and Methods
    if ((contextType === 'auto' || contextType === 'classes' || contextType === 'methods') && fullDocsData.Classes) {
      for (const item of fullDocsData.Classes) {
        const relevance = this.calculateEnhancedRelevance(keywords, item);
        if (relevance > 0) {
          const itemType = item.Type === 'Method' ? 'method' : 'class';
          matches.push({
            type: itemType,
            name: item.Path ? `${item.Path}.${item.Name}` : item.Name,
            description: item.Description || '',
            relevance,
            data: {
              ...item,
              source: 'full_docs',
              returnType: item.ReturnType,
              parameters: item.Parameters,
              path: item.Path
            }
          });
        }
      }
    }

    // Search Functions (if they exist in full docs)
    if ((contextType === 'auto' || contextType === 'functions') && fullDocsData.Functions) {
      for (const item of fullDocsData.Functions) {
        const relevance = this.calculateEnhancedRelevance(keywords, item);
        if (relevance > 0) {
          matches.push({
            type: 'function',
            name: item.Name,
            description: item.Description || '',
            relevance,
            data: {
              ...item,
              source: 'full_docs',
              returnType: item.ReturnType,
              parameters: item.Parameters
            }
          });
        }
      }
    }
  }

  /**
   * Search through index data as fallback
   */
  private searchInIndexData(keywords: string[], ahkIndex: any, contextType: string, matches: ContextMatch[]): void {
    // Avoid duplicates by checking existing match names
    const existingNames = new Set(matches.map(m => m.name.toLowerCase()));

    if (contextType === 'auto' || contextType === 'variables') {
      this.searchInCategoryFiltered(keywords, ahkIndex.variables, 'variable', matches, existingNames);
    }
    
    if (contextType === 'auto' || contextType === 'functions') {
      this.searchInCategoryFiltered(keywords, ahkIndex.functions, 'function', matches, existingNames);
    }
    
    if (contextType === 'auto' || contextType === 'classes') {
      this.searchInCategoryFiltered(keywords, ahkIndex.classes, 'class', matches, existingNames);
    }
    
    if (contextType === 'auto' || contextType === 'methods') {
      this.searchInCategoryFiltered(keywords, ahkIndex.methods, 'method', matches, existingNames);
    }
  }

  /**
   * Search in category while avoiding duplicates
   */
  private searchInCategoryFiltered(keywords: string[], items: any[], category: string, matches: ContextMatch[], existingNames: Set<string>): void {
    if (!items) return;

    for (const item of items) {
      const itemName = item.Name.toLowerCase();
      if (existingNames.has(itemName)) continue;

      const relevance = this.calculateRelevance(keywords, item);
      if (relevance > 0) {
        matches.push({
          type: category,
          name: item.Name,
          description: item.Description || '',
          relevance,
          data: {
            ...item,
            source: 'index'
          }
        });
        existingNames.add(itemName);
      }
    }
  }

  /**
   * Enhanced relevance calculation for full documentation items
   */
  private calculateEnhancedRelevance(keywords: string[], item: any): number {
    let relevance = 0;
    const itemText = `${item.Name} ${item.Description || ''} ${item.ReturnType || ''} ${item.Parameters || ''}`.toLowerCase();

    for (const keyword of keywords) {
      // Exact name match gets highest score
      if (item.Name.toLowerCase() === keyword) {
        relevance += 15;
      }
      // Name contains keyword gets high score
      else if (item.Name.toLowerCase().includes(keyword)) {
        relevance += 10;
      }
      // Description match gets medium score
      else if ((item.Description || '').toLowerCase().includes(keyword)) {
        relevance += 7;
      }
      // Return type match
      else if ((item.ReturnType || '').toLowerCase().includes(keyword)) {
        relevance += 5;
      }
      // Parameters match
      else if ((item.Parameters || '').toLowerCase().includes(keyword)) {
        relevance += 4;
      }
      // Path match (for methods)
      else if ((item.Path || '').toLowerCase().includes(keyword)) {
        relevance += 6;
      }
      // Keyword mapping match
      else if (this.keywordMap.has(keyword)) {
        const mappedElements = this.keywordMap.get(keyword)!;
        for (const element of mappedElements) {
          if (itemText.includes(element.toLowerCase())) {
            relevance += 3;
          }
        }
      }
    }

    return relevance;
  }

  /**
   * Generate enhanced context text with full documentation details
   */
  private generateEnhancedContextText(matches: ContextMatch[]): string {
    let contextText = '## 🎯 Relevant AutoHotkey v2 Context\n\n';
    contextText += '*Enhanced context from comprehensive documentation:*\n\n';

    const groupedMatches = this.groupMatchesByType(matches);

    for (const [type, items] of Object.entries(groupedMatches)) {
      if (items.length === 0) continue;

      contextText += `### ${this.capitalizeFirst(type)}s\n\n`;

      for (const match of items) {
        contextText += `**${match.name}**`;
        
        // Add return type if available
        if (match.data.returnType || match.data.ReturnType) {
          contextText += ` → *${match.data.returnType || match.data.ReturnType}*`;
        }
        
        contextText += `\n${match.description}\n`;
        
        // Add parameters if available
        if (match.data.parameters || match.data.Parameters) {
          const params = match.data.parameters || match.data.Parameters;
          if (params && params.length > 0) {
            if (typeof params === 'string') {
              contextText += `\n*Parameters:* ${params}\n`;
            } else if (Array.isArray(params)) {
              contextText += `\n*Parameters:* ${params.map((p: any) => p.Name || p).join(', ')}\n`;
            }
          }
        }
        
        // Add path for methods
        if (match.data.path || match.data.Path) {
          contextText += `\n*Class:* ${match.data.path || match.data.Path}\n`;
        }
        
        // Add examples if available
        if (match.data.Examples && match.data.Examples.length > 0) {
          contextText += `\n*Example:*\n\`\`\`autohotkey\n${match.data.Examples[0].Code}\n\`\`\`\n`;
        }
        
        // Add source indicator
        const source = match.data.source === 'full_docs' ? '📚 Full Docs' : '📋 Index';
        contextText += `\n*Source:* ${source}\n\n`;
      }
    }

    contextText += '\n*💡 This enhanced context uses comprehensive AutoHotkey v2 documentation for maximum accuracy.*\n';
    
    return contextText;
  }
} 
