#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { getToolMetadata } from '../src/core/tool-metadata.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const codeExecRoot = path.join(projectRoot, 'code-execution');
const runtimeImportPath = '../../runtime';
const serverOutputDir = path.join(codeExecRoot, 'servers', 'autohotkey');

await fs.mkdir(serverOutputDir, { recursive: true });

function escapeTemplateLiteral(value: string): string {
  return value.replace(/`/g, '\\`').replace(/\${/g, '\\${');
}

function toPascalCase(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
}

function toCamelCase(slug: string): string {
  const pascal = toPascalCase(slug);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

async function resetServerDirectory(): Promise<void> {
  await fs.rm(serverOutputDir, { recursive: true, force: true });
  await fs.mkdir(serverOutputDir, { recursive: true });
}

function buildFileContents(entry: ReturnType<typeof getToolMetadata>[number]): string {
  const slug = entry.slug;
  const pascalName = toPascalCase(slug);
  const functionName = `call${pascalName}`;
  const argsTypeName = `${pascalName}Args`;
  const description = escapeTemplateLiteral(
    entry.definition.description ?? 'AutoHotkey MCP tool.'
  );
  const schema = JSON.stringify(entry.definition.inputSchema ?? { type: 'object' }, null, 2);

  return `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

import { callAhkTool } from '${runtimeImportPath}/call-tool.js';
import type { ToolCallArguments, ToolCallResult } from '${runtimeImportPath}/types.js';

export const metadata = {
  name: '${entry.definition.name}',
  slug: '${slug}',
  category: '${entry.category}',
  description: \`${description}\`,
  inputSchema: ${schema}
} as const;

export type ${argsTypeName} = ToolCallArguments;

export async function ${functionName}(args: ${argsTypeName} = {}): Promise<ToolCallResult> {
  return callAhkTool(metadata.name, args);
}
`;
}

async function writeWrapperFiles(): Promise<void> {
  const metadata = getToolMetadata().slice().sort((a, b) => a.slug.localeCompare(b.slug));

  for (const entry of metadata) {
    const filePath = path.join(serverOutputDir, `${entry.slug}.ts`);
    await fs.writeFile(filePath, buildFileContents(entry), 'utf8');
  }

  const indexLines = metadata.map(
    (entry) => `export * as ${toCamelCase(entry.slug)} from './${entry.slug}.js';`
  );
  const indexContent = `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run "npm run codeexec:generate" to regenerate wrappers.

${indexLines.join('\n')}
`;
  await fs.writeFile(path.join(serverOutputDir, 'index.ts'), indexContent, 'utf8');
}

async function main(): Promise<void> {
  await fs.mkdir(codeExecRoot, { recursive: true });
  await resetServerDirectory();
  await writeWrapperFiles();
  console.log(`Generated code execution wrappers in ${path.relative(projectRoot, serverOutputDir)}`);
}

main().catch((error) => {
  console.error('Failed to generate code execution wrappers:', error);
  process.exit(1);
});

