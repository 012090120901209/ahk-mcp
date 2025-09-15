import { z } from 'zod';
import { getAhkIndex } from '../core/loader.js';
import logger from '../logger.js';
export const AhkSamplingEnhancerArgsSchema = z.object({
    originalPrompt: z.string().min(1, 'Original prompt is required'),
    includeExamples: z.boolean().optional().default(true),
    contextLevel: z.enum(['minimal', 'standard', 'comprehensive']).optional().default('standard'),
    modelPreferences: z.object({
        intelligencePriority: z.number().min(0).max(1).optional().default(0.8),
        costPriority: z.number().min(0).max(1).optional().default(0.3),
        speedPriority: z.number().min(0).max(1).optional().default(0.5)
    }).optional(),
    maxTokens: z.number().min(50).max(4000).optional().default(1000)
});
export const ahkSamplingEnhancerToolDefinition = {
    name: 'ahk_sampling_enhancer',
    description: 'Automatically enhances prompts with AutoHotkey v2 context using MCP sampling standards when AutoHotkey-related content is detected.',
    inputSchema: {
        type: 'object',
        properties: {
            originalPrompt: {
                type: 'string',
                description: 'Original prompt is required'
            },
            includeExamples: {
                type: 'boolean',
                description: 'Include code examples',
                default: true
            },
            contextLevel: {
                type: 'string',
                enum: ['minimal', 'standard', 'comprehensive'],
                description: 'Level of context to include',
                default: 'standard'
            },
            modelPreferences: {
                type: 'object',
                properties: {
                    intelligencePriority: {
                        type: 'number',
                        minimum: 0,
                        maximum: 1,
                        description: 'Intelligence priority (0-1)',
                        default: 0.8
                    },
                    costPriority: {
                        type: 'number',
                        minimum: 0,
                        maximum: 1,
                        description: 'Cost priority (0-1)',
                        default: 0.3
                    },
                    speedPriority: {
                        type: 'number',
                        minimum: 0,
                        maximum: 1,
                        description: 'Speed priority (0-1)',
                        default: 0.5
                    }
                }
            },
            maxTokens: {
                type: 'number',
                minimum: 50,
                maximum: 4000,
                description: 'Maximum tokens to generate',
                default: 1000
            }
        },
        required: ['originalPrompt']
    }
};
export class AhkSamplingEnhancer {
    constructor() {
        this.keywordPatterns = [
            // AutoHotkey-specific patterns
            /\b(autohotkey|ahk)\b/gi,
            /\b(hotkey|hotkeys|keyboard shortcut)\b/gi,
            /\b(gui|window|dialog|interface)\b/gi,
            /\b(clipboard|copy|paste)\b/gi,
            /\b(send|sendtext|sendinput)\b/gi,
            /\b(msgbox|tooltip|traytip)\b/gi,
            /\b(fileread|filewrite|file operations)\b/gi,
            /\b(automation|script|macro)\b/gi,
            /\b(winactivate|window management)\b/gi,
            /\b(array|map|object|class)\b/gi,
            // Built-in variable patterns
            /\ba_\w+\b/gi,
            // Function patterns  
            /\b\w+(read|write|get|set|show|add|create)\b/gi
        ];
        this.contextLevels = {
            minimal: { maxFunctions: 2, maxVariables: 2, includeExamples: false },
            standard: { maxFunctions: 4, maxVariables: 3, includeExamples: true },
            comprehensive: { maxFunctions: 6, maxVariables: 5, includeExamples: true }
        };
    }
    async execute(args) {
        try {
            logger.info('Analyzing prompt for AutoHotkey sampling enhancement');
            const validatedArgs = AhkSamplingEnhancerArgsSchema.parse(args);
            const { originalPrompt, includeExamples, contextLevel, modelPreferences, maxTokens } = validatedArgs;
            // Check if prompt contains AutoHotkey-related content
            const isAutoHotkeyRelated = this.detectAutoHotkeyContent(originalPrompt);
            if (!isAutoHotkeyRelated) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'No AutoHotkey-related content detected. Original prompt will be used without enhancement.'
                        }
                    ]
                };
            }
            // Generate enhanced context
            const enhancedContext = await this.generateEnhancedContext(originalPrompt, contextLevel, includeExamples);
            // Create sampling request following MCP standards
            const samplingRequest = this.createSamplingRequest(originalPrompt, enhancedContext, modelPreferences, maxTokens);
            return {
                content: [
                    {
                        type: 'text',
                        text: this.formatSamplingRequest(samplingRequest, enhancedContext) +
                            '\n\n---\n\n**Enhancement Details:**\n' +
                            `- Detected Keywords: ${this.extractKeywords(originalPrompt).join(', ')}\n` +
                            `- Context Level: ${contextLevel}\n` +
                            `- Enhancement Reason: AutoHotkey-related content detected, enhanced with relevant documentation`
                    }
                ]
            };
        }
        catch (error) {
            logger.error('Error in sampling enhancer:', error);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error enhancing prompt: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                ]
            };
        }
    }
    detectAutoHotkeyContent(text) {
        return this.keywordPatterns.some(pattern => pattern.test(text));
    }
    extractKeywords(text) {
        const keywords = [];
        for (const pattern of this.keywordPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                keywords.push(...matches.map(m => m.toLowerCase()));
            }
        }
        return [...new Set(keywords)];
    }
    async generateEnhancedContext(prompt, contextLevel, includeExamples) {
        const ahkIndex = getAhkIndex();
        if (!ahkIndex) {
            return '';
        }
        const config = this.contextLevels[contextLevel];
        const keywords = this.extractKeywords(prompt);
        let context = '## 🎯 AutoHotkey v2 Context (Auto-Enhanced)\n\n';
        context += '*This context was automatically injected based on detected AutoHotkey keywords.*\n\n';
        // Add relevant functions
        const relevantFunctions = this.findRelevantFunctions(keywords, ahkIndex, config.maxFunctions);
        if (relevantFunctions.length > 0) {
            context += '### Functions\n\n';
            for (const func of relevantFunctions) {
                context += `**${func.Name}**: ${func.Description}\n`;
                if (config.includeExamples && func.Examples && func.Examples.length > 0) {
                    context += `\n*Example:*\n\`\`\`autohotkey\n${func.Examples[0].Code}\n\`\`\`\n`;
                }
                context += '\n';
            }
        }
        // Add relevant variables
        const relevantVariables = this.findRelevantVariables(keywords, ahkIndex, config.maxVariables);
        if (relevantVariables.length > 0) {
            context += '### Built-in Variables\n\n';
            for (const variable of relevantVariables) {
                context += `**${variable.Name}**: ${variable.Description}\n\n`;
            }
        }
        // Add coding standards reminder
        context += '### AutoHotkey v2 Standards\n\n';
        context += '- Use `:=` for assignment, `=` for comparison\n';
        context += '- Initialize classes without `new`: `MyClass()` not `new MyClass()`\n';
        context += '- Use `Map()` for data structures instead of `{key: value}`\n';
        context += '- Use semicolon comments: `; comment`\n\n';
        return context;
    }
    findRelevantFunctions(keywords, ahkIndex, maxItems) {
        if (!ahkIndex.functions)
            return [];
        const matches = [];
        for (const func of ahkIndex.functions) {
            let relevance = 0;
            const funcText = `${func.Name} ${func.Description || ''}`.toLowerCase();
            for (const keyword of keywords) {
                if (funcText.includes(keyword)) {
                    relevance += keyword.length; // Longer keywords get higher weight
                }
            }
            if (relevance > 0) {
                matches.push({ item: func, relevance });
            }
        }
        return matches
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, maxItems)
            .map(m => m.item);
    }
    findRelevantVariables(keywords, ahkIndex, maxItems) {
        if (!ahkIndex.variables)
            return [];
        const matches = [];
        for (const variable of ahkIndex.variables) {
            let relevance = 0;
            const varText = `${variable.Name} ${variable.Description || ''}`.toLowerCase();
            for (const keyword of keywords) {
                if (varText.includes(keyword)) {
                    relevance += keyword.length;
                }
            }
            if (relevance > 0) {
                matches.push({ item: variable, relevance });
            }
        }
        return matches
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, maxItems)
            .map(m => m.item);
    }
    createSamplingRequest(originalPrompt, enhancedContext, modelPreferences, maxTokens) {
        return {
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `${enhancedContext}\n\n---\n\n**User Request:**\n${originalPrompt}`
                    }
                }
            ],
            modelPreferences: {
                hints: [
                    { name: 'claude-3' },
                    { name: 'sonnet' },
                    { name: 'gpt-4' }
                ],
                costPriority: modelPreferences?.costPriority || 0.3,
                speedPriority: modelPreferences?.speedPriority || 0.5,
                intelligencePriority: modelPreferences?.intelligencePriority || 0.8
            },
            systemPrompt: 'You are an expert AutoHotkey v2 developer. Use the provided context to write accurate, well-documented AutoHotkey v2 code following best practices. Always explain your code and include comments.',
            includeContext: 'thisServer',
            temperature: 0.1, // Low temperature for consistent code generation
            maxTokens,
            stopSequences: ['```\n\n---', 'END_OF_SCRIPT'],
            metadata: {
                purpose: 'autohotkey_code_generation',
                contextEnhanced: true,
                version: '2.0.0'
            }
        };
    }
    formatSamplingRequest(request, context) {
        let output = '## 🚀 Enhanced Sampling Request (MCP Standard)\n\n';
        output += '**AutoHotkey content detected!** Your prompt has been enhanced with relevant documentation.\n\n';
        output += '### 📋 Sampling Request Details\n\n';
        output += `- **Model Preferences**: Intelligence priority ${request.modelPreferences?.intelligencePriority}, Cost priority ${request.modelPreferences?.costPriority}\n`;
        output += `- **Max Tokens**: ${request.maxTokens}\n`;
        output += `- **Temperature**: ${request.temperature} (optimized for code generation)\n`;
        output += `- **Context Inclusion**: ${request.includeContext}\n\n`;
        output += '### 🎯 Enhanced Context Added\n\n';
        output += 'The following AutoHotkey v2 documentation has been automatically injected:\n\n';
        output += context;
        output += '\n### 🔄 Next Steps\n\n';
        output += '1. The client will review this enhanced prompt\n';
        output += '2. User can modify or approve the enhanced context\n';
        output += '3. LLM will generate AutoHotkey code with improved accuracy\n';
        output += '4. Result will be returned with documentation context\n\n';
        output += '*This follows MCP Sampling standards with human-in-the-loop controls.*';
        return output;
    }
}
