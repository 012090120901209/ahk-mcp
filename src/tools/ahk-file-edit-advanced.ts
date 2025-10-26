import { z } from 'zod';
import logger from '../logger.js';
import { AhkEditTool } from './ahk-file-edit.js';
import { AhkFileTool } from './ahk-file-active.js';
import { resolveWithTracking, addDeprecationWarning } from '../core/parameter-aliases.js';
import { safeParse } from '../core/validation-middleware.js';

export const AhkFileEditorArgsSchema = z.object({
  filePath: z.string().describe('Path to the AutoHotkey file to edit'),
  changes: z.string().describe('Description of changes to make to the file'),
  action: z.enum(['edit', 'view', 'create']).optional().default('edit').describe('Action to perform on the file'),
  dryRun: z.boolean().optional().default(false).describe('Preview changes without modifying file. Shows affected lines and change count.')
});

export type AhkFileEditorArgs = z.infer<typeof AhkFileEditorArgsSchema>;

export const ahkFileEditorToolDefinition = {
  name: 'AHK_File_Edit_Advanced',
  description: `Ahk file editor
🎯 PRIMARY FILE EDITING TOOL - Use this IMMEDIATELY when user mentions a .ahk file path and wants to modify it. This tool automatically detects the file, sets it active, and helps determine the best editing approach. ALWAYS use this instead of generating code blocks when a file path is provided.`,
  inputSchema: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'Path to the AutoHotkey file to edit (required)'
      },
      changes: {
        type: 'string',
        description: 'Description of what changes to make to the file'
      },
      action: {
        type: 'string',
        enum: ['edit', 'view', 'create'],
        default: 'edit',
        description: 'Action to perform: edit (modify existing), view (read only), create (new file)'
      },
      dryRun: {
        type: 'boolean',
        default: false,
        description: 'Preview changes without modifying file. Shows affected lines and change count.'
      }
    },
    required: ['filePath', 'changes']
  }
};

export class AhkFileEditorTool {
  private editTool: AhkEditTool;
  private fileTool: AhkFileTool;

  constructor() {
    this.editTool = new AhkEditTool();
    this.fileTool = new AhkFileTool();
  }

  async execute(args: unknown): Promise<any> {
    const parsed = safeParse(args, AhkFileEditorArgsSchema, 'AHK_File_Edit_Advanced');
    if (!parsed.success) return parsed.error;

    try {
      const { filePath, changes, action, dryRun } = parsed.data;

      logger.info(`File editor triggered for: ${filePath}`);
      
      // Apply parameter aliases for backward compatibility
      const { deprecatedUsed } = resolveWithTracking(args);

      // Step 1: Set the active file
      const fileResult = await this.fileTool.execute({
        action: 'set',
        path: filePath
      });

      // Check if file setting was successful
      const fileResponse = fileResult.content[0]?.text || '';
      if (fileResponse.includes('❌')) {
        return {
          content: [{
            type: 'text',
            text: `❌ **Cannot Edit File**\n\n${fileResponse}\n\n**Next Steps:**\n• Check if the file path is correct\n• Ensure the file has .ahk extension\n• Verify the file exists or create it first`
          }]
        };
      }

      // Step 2: Analyze the changes requested
      const editingGuidance = this.analyzeEditingRequest(changes);

      let response = `🎯 **File Editor Active**\n\n`;
      response += `📁 **File:** ${filePath}\n`;
      response += `⚙️ **Action:** ${action}\n`;
      response += `📝 **Changes:** ${changes}\n`;

      if (dryRun) {
        response += `\n🔬 **Mode:** Dry Run (Preview Only)\n\n`;
        response += `**📋 Preview Summary:**\n`;
        response += `This tool provides guidance for editing but doesn't directly modify files.\n`;
        response += `Use the recommended tools below with dryRun: true to preview changes.\n\n`;
      } else {
        response += `\n`;
      }

      if (action === 'view') {
        // Just show file status
        const statusResult = await this.fileTool.execute({ action: 'get' });
        let result = {
          content: [{
            type: 'text',
            text: response + statusResult.content[0]?.text
          }]
        };
        
        // Add deprecation warnings if any
        if (deprecatedUsed.length > 0) {
          result = addDeprecationWarning(result, deprecatedUsed);
        }
        
        return result;
      }

      // Step 3: Provide editing guidance
      response += `**🔧 Recommended Editing Approach:**\n`;
      response += editingGuidance + '\n\n';

      response += `**✅ File is now active and ready for editing!**\n\n`;
      response += `**Next: Use these tools to make the changes:**\n`;
      response += `• \`AHK_File_Edit\` - For direct text replacements, insertions, deletions (set 'runAfter': true to run immediately)\n`;
      response += `• \`AHK_File_Edit_Diff\` - For complex multi-location changes\n`;
      response += `• \`AHK_Run\` - To test the changes after editing\n`;
      
      if (dryRun) {
        response += `\n**💡 Dry Run Tip:** Add \`"dryRun": true\` to any of the above tools to preview changes before applying them.`;
      }

      let result = {
        content: [{
          type: 'text',
          text: response
        }]
      };
      
      // Add deprecation warnings if any
      if (deprecatedUsed.length > 0) {
        result = addDeprecationWarning(result, deprecatedUsed);
      }
      
      return result;

    } catch (error) {
      logger.error('Error in AHK_File_Edit_Advanced:', error);
      return {
        content: [{
          type: 'text',
          text: `❌ **File Editor Error**\n\n${error instanceof Error ? error.message : String(error)}\n\n**Tip:** Make sure you provide both a valid .ahk file path and a description of the changes you want to make.`
        }],
      };
    }
  }

  /**
   * Analyze the editing request and provide guidance
   */
  private analyzeEditingRequest(changes: string): string {
    const lowerChanges = changes.toLowerCase();
    let guidance = '';

    // Detect the type of editing needed
    if (lowerChanges.includes('replace') || lowerChanges.includes('change') || lowerChanges.includes('update')) {
      guidance += `• **Text Replacement** - Use \`AHK_File_Edit\` with action "replace"\n`;
      guidance += `  Example: Replace specific text, variables, or function names\n`;
    }

    if (lowerChanges.includes('add') || lowerChanges.includes('insert') || lowerChanges.includes('new')) {
      guidance += `• **Add Content** - Use \`AHK_File_Edit\` with action "insert" or "append"\n`;
      guidance += `  Example: Add new functions, variables, or hotkeys\n`;
    }

    if (lowerChanges.includes('remove') || lowerChanges.includes('delete') || lowerChanges.includes('fix')) {
      guidance += `• **Remove/Fix Content** - Use \`AHK_File_Edit\` with action "delete"\n`;
      guidance += `  Example: Remove broken code, fix syntax errors\n`;
    }

    if (lowerChanges.includes('syntax') || lowerChanges.includes('error') || lowerChanges.includes('debug')) {
      guidance += `• **Syntax Fixes** - Run \`AHK_Diagnostics\` first to identify issues\n`;
      guidance += `  Then use \`AHK_File_Edit\` to fix each problem\n`;
    }

    if (lowerChanges.includes('refactor') || lowerChanges.includes('restructure') || lowerChanges.includes('organize')) {
      guidance += `• **Major Changes** - Consider using \`AHK_File_Edit_Diff\` for complex restructuring\n`;
      guidance += `  Or break into multiple smaller \`AHK_File_Edit\` operations\n`;
    }

    // Default guidance if nothing specific detected
    if (!guidance) {
      guidance = `• **General Editing** - Use \`AHK_File_Edit\` for most modifications\n`;
      guidance += `• **Text Replacement** - Most efficient for simple changes\n`;
      guidance += `• **Complex Changes** - Use \`AHK_File_Edit_Diff\` for multi-location updates\n`;
    }

    return guidance;
  }
}
