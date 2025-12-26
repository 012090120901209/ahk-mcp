import { z } from 'zod';
import logger from '../logger.js';
import { activeFile } from '../core/active-file.js';
import { checkToolAvailability } from '../core/tool-settings.js';
import fs from 'fs/promises';
import { safeParse } from '../core/validation-middleware.js';

export const AhkFileArgsSchema = z.object({
  action: z.enum(['get', 'set', 'detect', 'clear']).default('get'),
  path: z.string().optional(),
  text: z.string().optional(),
});

export const ahkFileToolDefinition = {
  name: 'AHK_File_Active',
  description: `Ahk file
DETECT AND SET ACTIVE FILE FOR EDITING - Use this immediately when user mentions any .ahk file path. This enables all other editing tools to work on the specified file. Essential first step before any file modifications.`,
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['get', 'set', 'detect', 'clear'],
        default: 'get',
        description: 'Action to perform',
      },
      path: {
        type: 'string',
        description: 'File path for set action',
      },
      text: {
        type: 'string',
        description: 'Text to detect paths from',
      },
    },
  },
};

export class AhkFileTool {
  async execute(args: unknown): Promise<any> {
    const parsed = safeParse(args, AhkFileArgsSchema, 'AHK_File_Active');
    if (!parsed.success) return parsed.error;

    try {
      // Check if tool is enabled
      const availability = checkToolAvailability('AHK_File_Active');
      if (!availability.enabled) {
        return {
          content: [{ type: 'text', text: availability.message || 'Tool is disabled' }],
        };
      }

      const { action, path, text } = parsed.data;

      switch (action) {
        case 'get': {
          const status = activeFile.getStatus();
          let response = '📁 **Active File Status**\n\n';

          if (status.activeFile) {
            response += `✅ **Active:** ${status.activeFile}\n`;
            response += `📊 **Exists:** ${status.exists ? 'Yes' : 'No'}\n`;
            if (status.lastModified) {
              response += `⏰ **Set at:** ${status.lastModified.toLocaleString()}\n`;
            }

            // Try to show first few lines of the file
            if (status.exists) {
              try {
                const content = await fs.readFile(status.activeFile, 'utf-8');
                const lines = content.split('\n').slice(0, 5);
                response += '\n**Preview:**\n```autohotkey\n' + lines.join('\n') + '\n...\n```';
              } catch (err) {
                // Ignore read errors
              }
            }
          } else {
            response += '❌ No active file set\n\n';
            response += 'Set one by:\n';
            response += '• Mentioning a .ahk file path in any message\n';
            response += '• Using `AHK_File_Active` with action "set"\n';
            response += '• Running any tool with a file path\n';
          }

          return {
            content: [{ type: 'text', text: response }],
          };
        }

        case 'set': {
          if (!path) {
            throw new Error('Path required for set action');
          }

          const success = activeFile.setActiveFile(path);
          if (success) {
            return {
              content: [
                {
                  type: 'text',
                  text: `✅ Active file set to: ${activeFile.getActiveFile()}`,
                },
              ],
            };
          } else {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ Failed to set active file. Check that the file exists and has .ahk extension.`,
                },
              ],
            };
          }
        }

        case 'detect': {
          const searchText = text || path || '';
          if (!searchText) {
            throw new Error('Text or path required for detect action');
          }

          const detected = activeFile.detectAndSetFromText(searchText);
          if (detected) {
            return {
              content: [
                {
                  type: 'text',
                  text: `✅ Detected and set active file: ${detected}`,
                },
              ],
            };
          } else {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ No valid .ahk file path found in the text`,
                },
              ],
            };
          }
        }

        case 'clear': {
          activeFile.clear();
          return {
            content: [
              {
                type: 'text',
                text: '✅ Active file cleared',
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      logger.error('Error in AHK_File_Active tool:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
}
