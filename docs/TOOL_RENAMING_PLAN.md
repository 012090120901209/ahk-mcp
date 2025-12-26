# Tool Chain Renaming Plan

## 🎯 **Proposed File & Tool Renaming Strategy**

### **PHASE 1: File Operations Chain** (`ahk-file-*`)

| Current File Name    | Current Tool Name        | →   | New File Name               | New Tool Name                | Purpose                      |
| -------------------- | ------------------------ | --- | --------------------------- | ---------------------------- | ---------------------------- |
| `ahk-file.ts`        | `AHK_File_Active`        | →   | `ahk-file-active.ts`        | `AHK_File_Active`            | Set/get active file context  |
| `ahk-auto-file.ts`   | `AHK_File_Detect`        | →   | `ahk-file-detect.ts`        | `AHK_File_Detect`            | Auto-detect files from text  |
| `ahk-recent.ts`      | `AHK_File_Recent`        | →   | `ahk-file-recent.ts`        | `AHK_File_Recent`            | Recent file history          |
| `ahk-active-file.ts` | `AHK_Active_File`        | →   | (REMOVE - duplicate)        | (merge into AHK_File_Active) | Duplicate functionality      |
| (NEW)                | -                        | →   | `ahk-file-view.ts`          | `AHK_File_View`              | View files (already created) |
| `ahk-edit.ts`        | `AHK_File_Edit`          | →   | `ahk-file-edit.ts`          | `AHK_File_Edit`              | Edit active file             |
| `ahk-small-edit.ts`  | `AHK_File_Edit_Small`    | →   | `ahk-file-edit-small.ts`    | `AHK_File_Edit_Small`        | Small targeted edits         |
| `ahk-diff-edit.ts`   | `AHK_File_Edit_Diff`     | →   | `ahk-file-edit-diff.ts`     | `AHK_File_Edit_Diff`         | Diff-based editing           |
| `ahk-file-editor.ts` | `AHK_File_Edit_Advanced` | →   | `ahk-file-edit-advanced.ts` | `AHK_File_Edit_Advanced`     | Advanced editing features    |

**Chain Benefits**: All file operations start with `ahk-file-` making them easy
to discover and understand.

---

### **PHASE 2: Analysis Chain** (`ahk-analyze-*`)

| Current File Name        | Current Tool Name     | →   | New File Name                | New Tool Name         | Purpose                       |
| ------------------------ | --------------------- | --- | ---------------------------- | --------------------- | ----------------------------- |
| `ahk-analyze.ts`         | `AHK_Analyze`         | →   | `ahk-analyze-code.ts`        | `AHK_Analyze`         | Code analysis & documentation |
| `ahk-diagnostics.ts`     | `AHK_Diagnostics`     | →   | `ahk-analyze-diagnostics.ts` | `AHK_Diagnostics`     | Error detection               |
| `ahk-lsp.ts`             | `AHK_LSP`             | →   | `ahk-analyze-lsp.ts`         | `AHK_LSP`             | LSP-style analysis & fixes    |
| `ahk-summary.ts`         | `AHK_Summary`         | →   | `ahk-analyze-summary.ts`     | `AHK_Summary`         | Project summaries             |
| `ahk-vscode-problems.ts` | `AHK_VSCode_Problems` | →   | `ahk-analyze-vscode.ts`      | `AHK_VSCode_Problems` | VS Code integration           |
| `ahk-analyze-unified.ts` | `AHK_Analyze_Unified` | →   | `ahk-analyze-complete.ts`    | `AHK_Analyze_Unified` | Complete analysis pipeline    |

**Chain Benefits**: All analysis tools grouped together, clear progression from
basic to advanced.

---

### **PHASE 3: Execution Chain** (`ahk-run-*`)

| Current File Name        | Current Tool Name     | →   | New File Name        | New Tool Name         | Purpose                    |
| ------------------------ | --------------------- | --- | -------------------- | --------------------- | -------------------------- |
| `ahk-run.ts`             | `AHK_Run`             | →   | `ahk-run-script.ts`  | `AHK_Run`             | Execute AutoHotkey scripts |
| `ahk-debug-agent.ts`     | `AHK_Debug_Agent`     | →   | `ahk-run-debug.ts`   | `AHK_Debug_Agent`     | Debug execution            |
| `ahk-process-request.ts` | `AHK_Process_Request` | →   | `ahk-run-process.ts` | `AHK_Process_Request` | Process management         |

**Chain Benefits**: Clear execution workflow from running to debugging.

---

### **PHASE 4: Documentation Chain** (`ahk-docs-*`)

| Current File Name          | Current Tool Name       | →   | New File Name         | New Tool Name           | Purpose              |
| -------------------------- | ----------------------- | --- | --------------------- | ----------------------- | -------------------- |
| `ahk-doc-search.ts`        | `AHK_Doc_Search`        | →   | `ahk-docs-search.ts`  | `AHK_Doc_Search`        | Search documentation |
| `ahk-prompts.ts`           | `AHK_Prompts`           | →   | `ahk-docs-prompts.ts` | `AHK_Prompts`           | Prompt catalog       |
| `ahk-context-injector.ts`  | `AHK_Context_Injector`  | →   | `ahk-docs-context.ts` | `AHK_Context_Injector`  | Context injection    |
| `module-prompt-manager.ts` | `module_prompt_manager` | →   | `ahk-docs-modules.ts` | `module_prompt_manager` | Module management    |
| `ahk-sampling-enhancer.ts` | `AHK_Sampling_Enhancer` | →   | `ahk-docs-samples.ts` | `AHK_Sampling_Enhancer` | Code samples         |

**Chain Benefits**: All documentation and knowledge tools in one place.

---

### **PHASE 5: System Chain** (`ahk-system-*`)

| Current File Name | Current Tool Name | →   | New File Name            | New Tool Name  | Purpose                     |
| ----------------- | ----------------- | --- | ------------------------ | -------------- | --------------------------- |
| `ahk-config.ts`   | `AHK_Config`      | →   | `ahk-system-config.ts`   | `AHK_Config`   | Configuration management    |
| `ahk-settings.ts` | `AHK_Settings`    | →   | `ahk-system-settings.ts` | `AHK_Settings` | MCP settings                |
| `ahk-alpha.ts`    | `AHK_Alpha`       | →   | `ahk-system-alpha.ts`    | `AHK_Alpha`    | Alpha/experimental features |

**Chain Benefits**: System-level tools clearly separated from user-facing tools.

---

## 🔄 **Migration Strategy**

### **Step 1: Backward Compatibility**

```typescript
// In server.ts, register both old and new names during transition
'ahk_file_active': ahkFileActiveTool,      // Old name (deprecated)
'AHK_File_Active': ahkFileActiveTool // New name
```

### **Step 2: Deprecation Warnings**

```typescript
if (toolName.startsWith('ahk_') && !toolName.includes('_')) {
  logger.warn(
    `Tool name '${toolName}' is deprecated. Use '${newName}' instead.`
  );
}
```

### **Step 3: Gradual Migration**

1. **Phase 1**: Implement file chain first (most used)
2. **Phase 2**: Analysis chain (second most used)
3. **Phase 3-5**: Other chains in parallel
4. **Final**: Remove old names after transition period

---

## ❓ **Questions for Approval**

1. **File chain naming**:
   - Should it be `ahk-file-edit-small` or `ahk-file-small-edit`?
   - Should `ahk-file-active` just be `ahk-file`?

2. **Analysis chain**:
   - Keep `ahk-analyze-` or use `ahk-analysis-`?
   - Should LSP tool be `ahk-analyze-lsp` or something more descriptive?

3. **Tool name format**:
   - Hyphens in files: `ahk-file-edit.ts`
   - Underscores in tools: `AHK_File_Edit`
   - Is this consistent enough?

4. **Priority**:
   - Which chain should we implement first?
   - Should we do all at once or gradually?

5. **Special cases**:
   - What about `ahk-active-file.ts` which duplicates `ahk-file.ts`?
   - Should we merge them or keep both?

---

## 📊 **Impact Analysis**

### **Files to Change**

- **24 tool files** to rename
- **1 server file** to update all imports and registrations
- **Multiple test files** to update tool names
- **Documentation** to update with new names

### **Benefits**

- ✅ **Discoverability**: 5 clear chains instead of 24 random tools
- ✅ **Predictability**: Users can guess tool names
- ✅ **Scalability**: Easy to add new tools to chains
- ✅ **Mental model**: Clear tool organization

### **Risks**

- ⚠️ **Breaking change** for existing users
- ⚠️ **Documentation** needs updating
- ⚠️ **Testing** required for all renamed tools

---

## 🎯 **Recommendation**

**Start with Phase 1 (File Chain)** as proof of concept:

1. Most commonly used tools
2. Clearest naming pattern
3. Already have `ahk-file-view` working
4. Easiest to test and validate

Then roll out other phases based on success.

**What do you think of this plan?** Any naming changes or concerns?
