import { z } from 'zod';
import FlexSearch from 'flexsearch';
import { getAhkIndex, getAhkDocumentationFull } from '../core/loader.js';
import logger from '../logger.js';
import { safeParse } from '../core/validation-middleware.js';

export const AhkDocSearchArgsSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  category: z.enum(['auto', 'functions', 'variables', 'classes', 'methods']).optional().default('auto'),
  limit: z.number().min(1).max(50).optional().default(10)
});

export const ahkDocSearchToolDefinition = {
  name: 'AHK_Doc_Search',
  description: `Ahk doc search
Full-text search across AutoHotkey v2 docs using FlexSearch (functions, variables, classes, methods).`,
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      category: { type: 'string', enum: ['auto', 'functions', 'variables', 'classes', 'methods'], default: 'auto', description: 'Restrict search category' },
      limit: { type: 'number', minimum: 1, maximum: 50, default: 10 }
    },
    required: ['query']
  }
};

interface IndexedDoc {
  id: string;
  type: 'function' | 'variable' | 'class' | 'method';
  name: string;
  description?: string;
  path?: string;
}

export class AhkDocSearchTool {
  private static initialized = false;
  private static index = new FlexSearch.Document<IndexedDoc, true>({
    document: {
      id: 'id',
      index: ['name', 'description', 'path'],
      store: true
    },
    tokenize: 'forward',
    cache: true,
    preset: 'match'
  } as any);

  private static corpus: IndexedDoc[] = [];

  private ensureIndex(): void {
    if (AhkDocSearchTool.initialized) return;

    const index = getAhkIndex();
    const full = getAhkDocumentationFull();
    const docs: IndexedDoc[] = [];

    if (index) {
      (index.functions || []).forEach((f: any, i: number) => {
        docs.push({ id: `fn:${i}:${f.Name}`, type: 'function', name: f.Name, description: f.Description });
      });
      (index.variables || []).forEach((v: any, i: number) => {
        docs.push({ id: `var:${i}:${v.Name}`, type: 'variable', name: v.Name, description: v.Description });
      });
      (index.classes || []).forEach((c: any, i: number) => {
        docs.push({ id: `cls:${i}:${c.Name}`, type: 'class', name: c.Name, description: c.Description });
      });
      (index.methods || []).forEach((m: any, i: number) => {
        const fullName = m.Path ? `${m.Path}.${m.Name}` : m.Name;
        docs.push({ id: `meth:${i}:${fullName}`, type: 'method', name: fullName, description: m.Description, path: m.Path });
      });
    }

    // Optionally enrich from full docs
    if (full?.data) {
      (full.data.Functions || []).slice(0, 10000).forEach((f: any, i: number) => {
        docs.push({ id: `fdfn:${i}:${f.Name}`, type: 'function', name: f.Name, description: f.Description });
      });
    }

    AhkDocSearchTool.corpus = docs;
    try {
      // FlexSearch.Document prefers adding items individually
      for (const d of docs) {
        (AhkDocSearchTool.index as any).add(d);
      }
      AhkDocSearchTool.initialized = true;
      logger.info(`FlexSearch doc index initialized with ${docs.length} items`);
    } catch (err) {
      logger.error('Failed to build FlexSearch index:', err);
      AhkDocSearchTool.initialized = true; // Avoid retry loops
    }
  }

  async execute(args: unknown): Promise<any> {
    const parsed = safeParse(args, AhkDocSearchArgsSchema, 'AHK_Doc_Search');
    if (!parsed.success) return parsed.error;

    try {
      const { query, category, limit } = parsed.data;
      this.ensureIndex();

      const filterType = (t: string) => {
        if (category === 'auto') return true;
        if (category === 'functions') return t === 'function';
        if (category === 'variables') return t === 'variable';
        if (category === 'classes') return t === 'class';
        if (category === 'methods') return t === 'method';
        return true;
      };

      const finalLimit = limit ?? 10;
      let results: IndexedDoc[] = [];
      try {
        const sets = await (AhkDocSearchTool.index as any).search(query, {
          enrich: true,
          limit: finalLimit * 2,
          index: ['name', 'description', 'path']
        });
        // Aggregate unique docs across fields
        const seen = new Set<string>();
        const aggregated: IndexedDoc[] = [];
        for (const set of sets || []) {
          for (const unit of set.result || []) {
            const doc: IndexedDoc | undefined = unit.doc as any;
            if (!doc) continue;
            if (!filterType(doc.type)) continue;
            if (seen.has(doc.id)) continue;
            seen.add(doc.id);
            aggregated.push(doc);
            if (aggregated.length >= finalLimit) break;
          }
          if (aggregated.length >= finalLimit) break;
        }
        results = aggregated;
      } catch (err) {
        logger.error('FlexSearch search error:', err);
        // fallback: linear scan
        results = AhkDocSearchTool.corpus.filter((d) => filterType(d.type) && (
          d.name.toLowerCase().includes(query.toLowerCase()) ||
          (d.description || '').toLowerCase().includes(query.toLowerCase())
        )).slice(0, finalLimit);
      }

      if (results.length === 0) {
        return { content: [{ type: 'text', text: `No documentation matches for "${query}" (${category}).` }] };
      }

      const lines = results.map((d) => {
        const kind = d.type[0].toUpperCase() + d.type.slice(1);
        const desc = d.description ? (d.description.length > 180 ? d.description.slice(0, 177) + '...' : d.description) : '';
        const path = d.path ? ` [${d.path}]` : '';
        return `- ${kind}: ${d.name}${path}${desc ? `\n  ${desc}` : ''}`;
      });

      return {
        content: [{ type: 'text', text: `Results for "${query}" (${category}):\n\n${lines.join('\n')}` }]
      };
    } catch (error) {
      logger.error('Error in AHK_Doc_Search tool:', error);
      return {
        content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],

      };
    }
  }
}
