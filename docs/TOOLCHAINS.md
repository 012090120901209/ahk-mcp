# Toolchain Diagrams

This document summarizes the composite tools that orchestrate other tools or
internal steps. Each diagram shows the primary control flow; conditional paths
are annotated on the edges.

## AHK_Smart_Orchestrator (detect -> analyze -> view/edit)

```mermaid
flowchart LR
  SO["AHK_Smart_Orchestrator"]
  SO --> FP{"filePath provided"}
  FP -- no --> FD["AHK_File_Detect"]
  FP -- yes --> ANALYZE
  FD --> ANALYZE["AHK_Analyze structure cached"]
  ANALYZE --> TARGET["Resolve target entity line range"]
  TARGET --> VIEW["AHK_File_View"]
  VIEW --> MODE{"operation edit"}
  MODE -- yes --> ACTIVE["AHK_File_Active set"]
  MODE -- no --> RESP["Return context"]
  ACTIVE --> RESP
```

## AHK_Workflow_Analyze_Fix_Run (analyze -> fix -> verify -> run)

```mermaid
flowchart LR
  WF["AHK_Workflow_Analyze_Fix_Run"]
  WF --> READ["Read file fs"]
  READ --> ANALYZE1["AHK_Analyze summary"]
  ANALYZE1 --> ISSUES{"issues found"}
  ISSUES -- no --> RUNCHECK{"run after fix"}
  ISSUES -- yes --> FIX["AHK_LSP fix"]
  FIX --> WRITE["Write file fs"]
  WRITE --> ANALYZE2["AHK_Analyze verify"]
  ANALYZE2 --> RUNCHECK
  RUNCHECK -- yes --> RUN["AHK_Run"]
  RUNCHECK -- no --> SUMMARY["Summary response"]
  RUN --> SUMMARY
```

## AHK_Process_Request (parse -> route)

```mermaid
flowchart LR
  PR["AHK_Process_Request"]
  PR --> PARSE["Parse input detect path"]
  PARSE --> RESOLVE["Resolve path set active"]
  RESOLVE --> READ["Read file fs"]
  READ --> AUTO{"autoExecute"}
  AUTO -- no --> READY["Return parsed request"]
  AUTO -- yes --> ROUTE{"action"}
  ROUTE -- run --> RUN["AHK_Run"]
  ROUTE -- diagnose --> DIAG["AHK_Diagnostics"]
  ROUTE -- analyze --> ANALYZE["AHK_Analyze"]
  ROUTE -- edit --> EDIT["Return edit guidance"]
  ROUTE -- view --> VIEW["Inline file content"]
  RUN --> RESP["Combined response"]
  DIAG --> RESP
  ANALYZE --> RESP
  EDIT --> RESP
  VIEW --> RESP
  READY --> RESP
```

## Recommended Manual Toolchain: File Edit (agent guidance)

This is the suggested sequence from `docs/AHK_AGENT_INSTRUCTION.md` when a user
asks to edit an existing script. It is not a composite tool.

```mermaid
flowchart LR
  USER["User request with file path"]
  USER --> LOCATE{"Need to locate file"}
  LOCATE -- yes --> LIST["AHK_File_List"]
  LOCATE -- no --> ACTIVE["AHK_File_Active set"]
  LIST --> ACTIVE
  ACTIVE --> VIEW["AHK_File_View"]
  VIEW --> SIZE{"Edit size"}
  SIZE -- small --> SMALL["AHK_File_Edit_Small"]
  SIZE -- larger --> EDIT["AHK_File_Edit"]
  SMALL --> RUN{"Run after edit"}
  EDIT --> RUN
  RUN -- yes --> EXEC["AHK_Run"]
  RUN -- no --> RESP["Return edit summary"]
  EXEC --> RESP
```

## AHK_File_Edit_Advanced (guided edit)

```mermaid
flowchart LR
  ADV["AHK_File_Edit_Advanced"]
  ADV --> SET["AHK_File_Active set"]
  SET --> ACTION{"action"}
  ACTION -- view --> GET["AHK_File_Active get"]
  ACTION -- edit/create --> GUIDE["Analyze request return guidance"]
  GET --> RESP["Response"]
  GUIDE --> RESP
```

## Tools Outside These Chains

The following tools are not part of the chains shown above (based on the current
tool list used for `tools/list`):

- AHK_Analytics
- AHK_Config
- AHK_Context_Injector
- AHK_Debug_Agent
- AHK_Doc_Search
- AHK_File_Create
- AHK_File_Recent
- AHK_Library_Import
- AHK_Library_Info
- AHK_Library_List
- AHK_Lint
- AHK_Prompts
- AHK_Settings
- AHK_Tools_Search
- AHK_VSCode_Open
- AHK_VSCode_Problems
