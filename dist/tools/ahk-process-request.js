import { z } from 'zod';
import fs from 'fs/promises';
import logger from '../logger.js';
import { setActiveFile, getActiveFile, detectFilePaths, resolveFilePath } from '../core/config.js';
import { AhkDiagnosticsTool } from './ahk-diagnostics.js';
import { AhkAnalyzeTool } from './ahk-analyze.js';
import { AhkRunTool } from './ahk-run.js';
export const AhkProcessRequestArgsSchema = z.object({
    input: z.string().describe('Multi-line input containing file path and instructions'),
    autoExecute: z.boolean().optional().default(true).describe('Automatically execute detected actions'),
    defaultAction: z.enum(['analyze', 'diagnose', 'run', 'edit', 'auto']).optional().default('auto')
});
export const ahkProcessRequestToolDefinition = {
    name: 'ahk_process_request',
    description: 'Process user requests that contain file paths and instructions for AutoHotkey scripts',
    inputSchema: {
        type: 'object',
        properties: {
            input: {
                type: 'string',
                description: 'Multi-line input containing file path and instructions'
            },
            autoExecute: {
                type: 'boolean',
                default: true,
                description: 'Automatically execute detected actions'
            },
            defaultAction: {
                type: 'string',
                enum: ['analyze', 'diagnose', 'run', 'edit', 'auto'],
                default: 'auto',
                description: 'Default action if not specified'
            }
        },
        required: ['input']
    }
};
export class AhkProcessRequestTool {
    constructor() {
        this.diagnosticsTool = new AhkDiagnosticsTool();
        this.analyzeTool = new AhkAnalyzeTool();
        this.runTool = new AhkRunTool();
    }
    /**
     * Parse multi-line input to extract file path and instructions
     */
    parseInput(input) {
        const lines = input.split('\n').map(l => l.trim()).filter(l => l);
        let filePath;
        let instruction = '';
        let action = 'view';
        // Look for file paths in the input
        const detectedPaths = detectFilePaths(input);
        // Try to find the file path (usually first line or first detected path)
        if (detectedPaths.length > 0) {
            // Try to resolve the first detected path
            const resolved = resolveFilePath(detectedPaths[0]);
            if (resolved) {
                filePath = resolved;
            }
            else {
                filePath = detectedPaths[0]; // Keep unresolved for error reporting
            }
        }
        // Extract instruction (usually after the file path)
        // Remove the file path line if it was on its own line
        const remainingLines = lines.filter(line => {
            // Don't include lines that are just the file path
            if (detectedPaths.some(p => line === p || line === `"${p}"` || line === `'${p}'`)) {
                return false;
            }
            return true;
        });
        instruction = remainingLines.join(' ').trim();
        // Detect action from instruction keywords
        const instructionLower = instruction.toLowerCase();
        if (instructionLower.includes('run') || instructionLower.includes('execute') || instructionLower.includes('test')) {
            action = 'run';
        }
        else if (instructionLower.includes('analyz') || instructionLower.includes('analyse') || instructionLower.includes('review')) {
            action = 'analyze';
        }
        else if (instructionLower.includes('diagnos') || instructionLower.includes('check') || instructionLower.includes('validat') || instructionLower.includes('error') || instructionLower.includes('fix')) {
            action = 'diagnose';
        }
        else if (instructionLower.includes('edit') || instructionLower.includes('modify') || instructionLower.includes('change') || instructionLower.includes('update') || instructionLower.includes('add') || instructionLower.includes('create')) {
            action = 'edit';
        }
        // If no instruction but file path exists, default to viewing/analyzing
        if (!instruction && filePath) {
            instruction = 'View and analyze this AutoHotkey script';
            action = 'analyze';
        }
        return {
            filePath,
            instruction: instruction || 'Process this AutoHotkey script',
            action
        };
    }
    /**
     * Execute the parsed request
     */
    async execute(args) {
        try {
            const { input, autoExecute, defaultAction } = AhkProcessRequestArgsSchema.parse(args);
            // Parse the input
            const parsed = this.parseInput(input);
            // Override action if defaultAction is not 'auto'
            if (defaultAction !== 'auto') {
                parsed.action = defaultAction;
            }
            // Set active file if we found one
            if (parsed.filePath) {
                const resolved = resolveFilePath(parsed.filePath);
                if (resolved) {
                    setActiveFile(resolved);
                    parsed.filePath = resolved;
                    logger.info(`Set active file: ${resolved}`);
                }
                else {
                    return {
                        content: [{
                                type: 'text',
                                text: `❌ File not found: ${parsed.filePath}\n\nPlease check the file path and try again.`
                            }],
                        isError: true
                    };
                }
            }
            else {
                // Try to use existing active file
                parsed.filePath = getActiveFile();
                if (!parsed.filePath) {
                    return {
                        content: [{
                                type: 'text',
                                text: '❌ No file path detected in input and no active file set.\n\nPlease provide a file path or set an active file first.'
                            }],
                        isError: true
                    };
                }
            }
            // Read the file content if needed
            let codeContent = '';
            try {
                codeContent = await fs.readFile(parsed.filePath, 'utf-8');
                parsed.codeContent = codeContent;
            }
            catch (error) {
                logger.error(`Failed to read file: ${parsed.filePath}`, error);
                return {
                    content: [{
                            type: 'text',
                            text: `❌ Failed to read file: ${parsed.filePath}\n\nError: ${error}`
                        }],
                    isError: true
                };
            }
            // Build response
            let response = `📄 **File:** ${parsed.filePath}\n`;
            response += `📝 **Request:** ${parsed.instruction}\n`;
            response += `⚙️ **Action:** ${parsed.action}\n\n`;
            // Execute the action if autoExecute is true
            if (autoExecute) {
                let actionResult;
                switch (parsed.action) {
                    case 'run':
                        response += '🚀 **Running script...**\n\n';
                        actionResult = await this.runTool.execute({
                            mode: 'run',
                            filePath: parsed.filePath,
                            wait: true,
                            errorStdOut: 'utf-8',
                            enabled: true,
                            runner: 'native',
                            scriptArgs: [],
                            timeout: 30000,
                            killOnExit: true,
                            detectWindow: false
                        });
                        break;
                    case 'diagnose':
                        response += '🔍 **Running diagnostics...**\n\n';
                        actionResult = await this.diagnosticsTool.execute({
                            code: codeContent,
                            enableClaudeStandards: true,
                            severity: 'all'
                        });
                        break;
                    case 'analyze':
                        response += '📊 **Analyzing script...**\n\n';
                        actionResult = await this.analyzeTool.execute({
                            code: codeContent,
                            includeDocumentation: true,
                            includeUsageExamples: true,
                            analyzeComplexity: true
                        });
                        break;
                    case 'edit':
                        response += '✏️ **Ready to edit...**\n\n';
                        response += 'The file is now set as active. You can:\n';
                        response += '• Use edit tools to modify the script\n';
                        response += '• Run diagnostics to check for issues\n';
                        response += '• Execute the script with ahk_run\n';
                        break;
                    case 'view':
                        response += '👁️ **File content:**\n\n';
                        response += '```autohotkey\n' + codeContent + '\n```\n';
                        break;
                }
                // Add action result if available
                if (actionResult && actionResult.content) {
                    response += '\n**Result:**\n';
                    actionResult.content.forEach((content) => {
                        if (content.type === 'text') {
                            response += content.text + '\n';
                        }
                    });
                }
            }
            else {
                response += '\n**Ready to process.** Use the appropriate tool to execute the action.';
            }
            return {
                content: [
                    { type: 'text', text: response.trim() },
                    {
                        type: 'text',
                        text: JSON.stringify({
                            parsed,
                            activeFile: getActiveFile()
                        }, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            logger.error('Error in ahk_process_request tool:', error);
            return {
                content: [{
                        type: 'text',
                        text: `Error: ${error instanceof Error ? error.message : String(error)}`
                    }],
                isError: true
            };
        }
    }
    /**
     * Quick method to process a file path and instruction
     */
    static async processQuick(filePath, instruction) {
        const tool = new AhkProcessRequestTool();
        return tool.execute({
            input: `${filePath}\n\n${instruction}`,
            autoExecute: true,
            defaultAction: 'auto'
        });
    }
}
