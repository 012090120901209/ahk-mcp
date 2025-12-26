# Advanced Features - Analytics & Smart Context

## Overview

Advanced context management features that learn from usage patterns and provide
intelligent suggestions.

## 1. Tool Usage Analytics

### Features

- **Automatic tracking** of all tool calls
- **Success/failure metrics** per tool
- **Performance monitoring** (execution times)
- **Error pattern detection**
- **Usage trend analysis**

### Analytics Tool

New tool: `AHK_Analytics`

**Actions:**

- `summary` - Overall statistics and top tools
- `tool_stats` - Detailed stats for specific tool
- `recent` - Recent tool call history
- `export` - JSON export of all data
- `clear` - Reset all analytics

**Example Usage:**

```json
{
  "action": "summary"
}
```

**Output:**

- Total calls
- Overall success rate
- Average duration
- Most used tools
- Problematic tools (high failure rates)

### Implementation

**File:** `src/core/tool-analytics.ts`

Tracks:

- Tool name
- Timestamp
- Success/failure
- Duration
- Error details

Max 1000 metrics in memory (rolling window).

### Integration

Analytics automatically recorded in `src/server.ts`:

```typescript
// On success
toolAnalytics.recordCall(name, true, duration);

// On failure
toolAnalytics.recordCall(name, false, duration, error);
```

## 2. Smart Context Injection

### Features

- **Pattern-based recommendations** from usage history
- **Domain detection** (GUI, debugging, file ops)
- **Dynamic tool descriptions** based on success rates
- **Resource suggestions** based on activity

### Context Analyzer

**File:** `src/core/smart-context.ts`

**Methods:**

- `suggestContext()` - Get resource recommendations
- `enhanceToolDescription()` - Add usage notes to descriptions
- `detectWorkingDomain()` - Identify user's focus area
- `getSessionContext()` - Get current session overview

### Context Suggestions

Based on usage patterns:

- **Heavy file tool usage** → Suggest active file resource
- **Diagnostic failures** → Suggest error handling module
- **GUI tool usage** → Suggest GUI module
- **Frequent context requests** → Provide comprehensive standards

**Priority scoring:** 0-100 (higher = more relevant)

### Enhanced Tool Descriptions

Tools with low success rates show warnings:

```
⚠️ Note: This tool has a 65% success rate. Common issues: FileNotFoundError
```

Slow tools show performance notes:

```
⏱️ Performance: Average execution time is 3.2s
```

Popular tools show usage stats:

```
⭐ Most Used Tool - 127 total calls
```

## 3. Resource Subscriptions

### Features

- **Track resource access** patterns
- **Identify popular resources**
- **Cleanup stale subscriptions**
- **Update notifications** (extensible)

### Subscription Manager

**File:** `src/core/resource-subscriptions.ts`

**Tracking:**

- Resource URI
- Subscription time
- Last accessed time
- Total access count

**Methods:**

- `subscribe(uri)` - Register resource access
- `unsubscribe(uri)` - Remove subscription
- `getMostAccessedResources()` - Get top N resources
- `cleanupStale()` - Remove old subscriptions
- `getStats()` - Get subscription statistics

### Auto-Tracking

Resources automatically tracked when accessed:

```typescript
// In ReadResourceRequestSchema handler
resourceSubscriptions.subscribe(normalizedUri);
```

### Use Cases

1. **Identify popular documentation** - See which docs users access most
2. **Optimize resource loading** - Cache frequently accessed resources
3. **Context recommendations** - Suggest resources based on patterns
4. **Analytics** - Understand resource usage trends

## 4. Usage Analytics API

### Tool Analytics

```typescript
import { toolAnalytics } from './core/tool-analytics';

// Get overall summary
const summary = toolAnalytics.getSummary();

// Get specific tool stats
const stats = toolAnalytics.getToolStats('AHK_File_Edit');

// Get success rate
const rate = toolAnalytics.getSuccessRate('AHK_Run');

// Get most used tools
const topTools = toolAnalytics.getMostUsedTools(10);

// Get problematic tools
const problems = toolAnalytics.getProblematicTools(5, 30);

// Export all data
const json = toolAnalytics.exportMetrics();
```

### Smart Context

```typescript
import { smartContext } from './core/smart-context';

// Get context suggestions
const suggestions = smartContext.suggestContext();

// Enhance tool description
const enhanced = smartContext.enhanceToolDescription(
  'AHK_Run',
  baseDescription
);

// Detect current domain
const domain = smartContext.detectWorkingDomain();

// Get session context
const context = smartContext.getSessionContext();
```

### Resource Subscriptions

```typescript
import { resourceSubscriptions } from './core/resource-subscriptions';

// Get all subscriptions
const subs = resourceSubscriptions.getSubscriptions();

// Get most accessed
const popular = resourceSubscriptions.getMostAccessedResources(10);

// Get stats
const stats = resourceSubscriptions.getStats();

// Cleanup stale (24 hours default)
const cleaned = resourceSubscriptions.cleanupStale();
```

## 5. Metrics Visualization

### Analytics Summary Format

```
# Tool Usage Analytics Summary

## Overall Statistics
- Total Calls: 247
- Unique Tools: 18
- Success Rate: 89.47%
- Average Duration: 342.15ms

## Most Used Tools
1. AHK_File_Edit: 54 calls
2. AHK_Run: 38 calls
3. AHK_Diagnostics: 31 calls
4. AHK_File_View: 27 calls
5. AHK_Doc_Search: 19 calls

## ⚠️ Problematic Tools (High Failure Rate)
- AHK_Run: 23.68% failure rate
- AHK_File_Edit_Diff: 33.33% failure rate
```

### Tool-Specific Stats

```
# Statistics for AHK_File_Edit

## Usage Metrics
- Total Calls: 54
- Successful Calls: 51
- Failed Calls: 3
- Success Rate: 94.44%
- Average Duration: 287.32ms
- Last Used: 2025-09-29T14:23:45.123Z

## Common Errors
- FileNotFoundError: 2 occurrences
- PermissionError: 1 occurrence
```

## 6. Best Practices

### For Tool Developers

1. **Always record analytics** - Wrap tool execution with analytics calls
2. **Provide error context** - Include meaningful error messages
3. **Monitor performance** - Check average durations regularly
4. **Act on failures** - Investigate tools with high failure rates

### For MCP Server Operators

1. **Review analytics periodically** - Use `AHK_Analytics` tool
2. **Optimize slow tools** - Tools >2s average need attention
3. **Fix problematic tools** - Address tools with >20% failure rate
4. **Clean up subscriptions** - Run cleanup monthly

### For Context Enhancement

1. **Trust the patterns** - Smart context learns from actual usage
2. **Review suggestions** - Check suggested resources for relevance
3. **Extend domains** - Add domain detection for your use cases
4. **Customize priorities** - Adjust suggestion priority thresholds

## 7. Configuration

### Analytics Settings

```typescript
// In tool-analytics.ts
private maxMetrics = 1000; // Max metrics in memory
```

### Subscription Cleanup

```typescript
// Default stale timeout: 24 hours
resourceSubscriptions.cleanupStale(24 * 60 * 60 * 1000);
```

### Context Priority Thresholds

```typescript
// In smart-context.ts
if (fileToolCalls > 5) {
  // Adjust threshold
  suggestions.push({
    priority: 90, // Adjust priority
  });
}
```

## 8. Future Enhancements

### Planned Features

1. **Predictive context loading** - Pre-load likely resources
2. **A/B testing framework** - Test tool description variations
3. **ML-based recommendations** - Advanced pattern recognition
4. **Real-time dashboards** - Live analytics visualization
5. **Resource caching strategy** - Cache based on access patterns
6. **Tool chaining detection** - Identify common tool sequences
7. **User profiling** - Personalized recommendations

### Extension Points

**Custom analytics:**

```typescript
toolAnalytics.recordCustomMetric({
  category: 'feature_usage',
  name: 'gui_layout_assist',
  value: 1,
});
```

**Custom context rules:**

```typescript
smartContext.addContextRule({
  condition: stats => stats.guiToolCalls > 10,
  resource: 'ahk://module/gui-advanced',
  priority: 95,
});
```

---

**Version:** 2.0.0 **Date:** 2025-09-29 **Status:** ✅ Implemented
