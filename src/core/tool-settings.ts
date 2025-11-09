import fs from 'fs';
import path from 'path';
import os from 'os';
import logger from '../logger.js';

/**
 * Tool settings configuration
 * Controls which tools are enabled/disabled
 */
export interface ToolSettings {
  // Core tool settings
  enabledTools: {
    AHK_File_Edit: boolean;
    AHK_File_Edit_Diff: boolean;
    AHK_File_Edit_Advanced: boolean;
    AHK_File_Edit_Small: boolean;
    AHK_File_View: boolean;
    AHK_File_Detect: boolean;
    AHK_File_Active: boolean;
    AHK_File_Create: boolean;
    AHK_Active_File: boolean;
    AHK_Process_Request: boolean;
    AHK_Alpha: boolean;
    // Other tools can be added here
    [key: string]: boolean;
  };
  
  // Global settings
  allowFileEditing: boolean;
  allowFileDetection: boolean;
  requireExplicitPaths: boolean;
  
  // Safety settings
  alwaysBackup: boolean;
  restrictToAhkFiles: boolean;
  maxFileSize: number; // in bytes

  // Convenience settings
  autoRunAfterEdit: boolean;
}

class ToolSettingsManager {
  private static instance: ToolSettingsManager;
  private settings: ToolSettings;
  private settingsPath: string;
  
  private constructor() {
    this.settingsPath = this.getSettingsPath();
    this.settings = this.loadSettings();
  }
  
  static getInstance(): ToolSettingsManager {
    if (!ToolSettingsManager.instance) {
      ToolSettingsManager.instance = new ToolSettingsManager();
    }
    return ToolSettingsManager.instance;
  }
  
  private getSettingsPath(): string {
    // Check for environment override
    if (process.env.AHK_MCP_SETTINGS_PATH) {
      return process.env.AHK_MCP_SETTINGS_PATH;
    }
    
    // Default to config directory
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    const base = process.platform === 'win32' ? appData : path.join(os.homedir(), '.config');
    const configDir = path.join(base, 'ahk-mcp');
    
    // Ensure directory exists
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    return path.join(configDir, 'tool-settings.json');
  }
  
  private getDefaultSettings(): ToolSettings {
    return {
      enabledTools: {
        // File editing tools - can be disabled
        AHK_File_Edit: true,
        AHK_File_Edit_Diff: true,
        AHK_File_Edit_Advanced: true,
        AHK_File_Edit_Small: true,
        AHK_File_View: true,
        AHK_File_List: true,
        AHK_File_Detect: true,
        AHK_File_Active: true,
        AHK_File_Create: true,
        AHK_Active_File: true,
        AHK_Process_Request: true,
        AHK_Alpha: true,

        // Core tools - always enabled
        AHK_Diagnostics: true,
        AHK_Analyze: true,
        AHK_Analyze_Unified: true,
        AHK_Run: true,
        AHK_Summary: true,
        AHK_Prompts: true,
        AHK_Debug_Agent: true,
        AHK_Doc_Search: true,
        AHK_Context_Injector: true,
        AHK_Sampling_Enhancer: true,
        AHK_VSCode_Problems: true,
        AHK_File_Recent: true,
        AHK_Config: true,
        AHK_LSP: true,
        AHK_Settings: true
      },
      
      // Global settings
      allowFileEditing: true,
      allowFileDetection: true,
      requireExplicitPaths: false,
      
      // Safety settings
      alwaysBackup: true,
      restrictToAhkFiles: true,
      maxFileSize: 10 * 1024 * 1024, // 10 MB

      // Convenience settings
      autoRunAfterEdit: false
    };
  }
  
  private loadSettings(): ToolSettings {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const content = fs.readFileSync(this.settingsPath, 'utf-8');
        const loaded = JSON.parse(content);
        const defaults = this.getDefaultSettings();
        const mergedEnabled = {
          ...defaults.enabledTools,
          ...(loaded.enabledTools || {}),
        };

        return {
          ...defaults,
          ...loaded,
          enabledTools: mergedEnabled,
        };
      }
    } catch (error) {
      logger.warn('Failed to load tool settings, using defaults:', error);
    }

    return this.getDefaultSettings();
  }
  
  saveSettings(): void {
    try {
      fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2), 'utf-8');
      logger.info('Tool settings saved');
    } catch (error) {
      logger.error('Failed to save tool settings:', error);
    }
  }
  
  /**
   * Check if a tool is enabled
   */
  isToolEnabled(toolName: string): boolean {
    // Check specific tool setting
    if (toolName in this.settings.enabledTools) {
      return this.settings.enabledTools[toolName];
    }
    
    // Default to enabled for unknown tools
    return true;
  }
  
  /**
   * Enable or disable a tool
   */
  setToolEnabled(toolName: string, enabled: boolean): void {
    this.settings.enabledTools[toolName] = enabled;
    this.saveSettings();
    logger.info(`Tool ${toolName} ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Check if file editing is allowed
   */
  isFileEditingAllowed(): boolean {
    return this.settings.allowFileEditing;
  }
  
  /**
   * Check if file detection is allowed
   */
  isFileDetectionAllowed(): boolean {
    return this.settings.allowFileDetection;
  }
  
  /**
   * Get all settings
   */
  getSettings(): ToolSettings {
    return { ...this.settings };
  }
  
  /**
   * Update settings
   */
  updateSettings(updates: Partial<ToolSettings>): void {
    this.settings = { ...this.settings, ...updates };
    if (updates.enabledTools) {
      this.settings.enabledTools = { ...this.settings.enabledTools, ...updates.enabledTools };
    }
    this.saveSettings();
  }
  
  /**
   * Reset to default settings
   */
  resetToDefaults(): void {
    this.settings = this.getDefaultSettings();
    this.saveSettings();
    logger.info('Tool settings reset to defaults');
  }
  
  /**
   * Enable/disable file editing tools as a group
   */
  setFileEditingTools(enabled: boolean): void {
    const fileTools = [
      'AHK_File_Edit',
      'AHK_File_Edit_Diff',
      'AHK_File_Edit_Advanced',
      'AHK_File_Edit_Small',
      'AHK_File_View',
      'AHK_File_List',
      'AHK_File_Detect',
      'AHK_File_Active',
      'AHK_File_Create',
      'AHK_Process_Request',
      'AHK_Alpha'
    ];
    for (const tool of fileTools) {
      this.settings.enabledTools[tool] = enabled;
    }
    this.settings.allowFileEditing = enabled;
    this.settings.allowFileDetection = enabled;
    this.saveSettings();
    logger.info(`File editing tools ${enabled ? 'enabled' : 'disabled'}`);
  }

  setAutoRunAfterEdit(enabled: boolean): void {
    this.settings.autoRunAfterEdit = enabled;
    this.saveSettings();
    logger.info(`Auto-run after edit ${enabled ? 'enabled' : 'disabled'}`);
  }

  shouldAutoRunAfterEdit(): boolean {
    return this.settings.autoRunAfterEdit;
  }

  /**
   * Get tool availability message
   */
  getDisabledMessage(toolName: string): string {
    if (!this.isToolEnabled(toolName)) {
      return `⚠️ Tool '${toolName}' is currently disabled.\n\nTo enable it, use the 'AHK_Settings' tool:\n\`\`\`json\n{\n  "tool": "AHK_Settings",\n  "arguments": {\n    "action": "enable_tool",\n    "tool": "${toolName}"\n  }\n}\n\`\`\``;
    }
    
    if (
      !this.settings.allowFileEditing &&
      ['AHK_File_Edit', 'AHK_File_Edit_Diff', 'AHK_File_Edit_Small', 'AHK_File_Edit_Advanced', 'AHK_File_Create'].includes(toolName)
    ) {
      return `⚠️ File editing is currently disabled.\n\nTo enable it, use the 'AHK_Settings' tool:\n\`\`\`json\n{\n  "tool": "AHK_Settings",\n  "arguments": {\n    "action": "enable_editing"\n  }\n}\n\`\`\``;
    }
    
    return '';
  }
}

// Export singleton instance
export const toolSettings = ToolSettingsManager.getInstance();

// Helper functions
export function isToolEnabled(toolName: string): boolean {
  return toolSettings.isToolEnabled(toolName);
}

export function checkToolAvailability(toolName: string): { enabled: boolean; message?: string } {
  const enabled = toolSettings.isToolEnabled(toolName);
  if (!enabled) {
    return {
      enabled: false,
      message: toolSettings.getDisabledMessage(toolName)
    };
  }
  return { enabled: true };
}
