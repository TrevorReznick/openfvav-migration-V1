import { readFileSync } from 'node:fs';
import { basename, extname, resolve } from 'node:path';
import { glob } from 'glob';
import { createHash } from 'node:crypto';
import type { ComponentNode, PropNode } from '../shared/types/repository.js';

// ============================================================================
// Component Observer — detects UI components and their props
// ============================================================================

/**
 * Generate a stable ID for a node using SHA-256 hash.
 */
function stableId(prefix: string, input: string): string {
  return `${prefix}-${createHash('sha256').update(input).digest('hex').slice(0, 12)}`;
}

/**
 * Detect framework from file extension.
 */
function detectFramework(filePath: string): string {
  const ext = extname(filePath);
  switch (ext) {
    case '.astro': return 'astro';
    case '.tsx':
    case '.jsx': return 'react';
    case '.vue': return 'vue';
    case '.svelte': return 'svelte';
    default: return 'unknown';
  }
}

/**
 * Extract props from TypeScript/JavaScript component source.
 *
 * Detects:
 *   - interface Props { ... }
 *   - type Props = { ... }
 *   - function Foo({ prop1, prop2 }: Props)
 *   - function Foo(props: Props)
 */
function extractProps(content: string, filePath: string): PropNode[] {
  const props: PropNode[] = [];
  const propMap = new Map<string, { type: string; required: boolean; defaultValue: unknown | null }>();

  // Extract interface Props / type Props
  const interfaceMatch = content.match(/(?:interface|type)\s+(\w*Props\w*)\s*(?:=\s*)?\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/s);
  if (interfaceMatch) {
    const body = interfaceMatch[2];
    // Parse each property
    const propLines = body.split(/[;\n]/);
    for (const line of propLines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) continue;

      // Match: propName?: Type or propName: Type
      const propMatch = trimmed.match(/^(\w+)(\?)?:\s*(.+)$/);
      if (propMatch) {
        const [, name, optional, typeStr] = propMatch;
        const type = typeStr.replace(/\/\/.*$/, '').trim();
        propMap.set(name, {
          type,
          required: !optional,
          defaultValue: null,
        });
      }
    }
  }

  // Also check for destructured params: function Foo({ prop1, prop2 }: Props)
  const destructuredMatch = content.match(/(?:function|const)\s+\w+\s*(?:=\s*(?:\([^)]*\)\s*=>|\([^)]*\)\s*=>\s*\{)?)?[^{]*?\(\s*\{\s*([^}]+)\s*\}\s*(?::\s*(\w*Props\w*))?/s);
  if (destructuredMatch) {
    const paramStr = destructuredMatch[1];
    const paramEntries = paramStr.split(',').map((s) => s.trim()).filter(Boolean);
    for (const entry of paramEntries) {
      // Match: propName or propName: alias
      const parts = entry.split(':').map((s) => s.trim());
      const name = parts[0];
      // Check if we already got this from interface
      let existing = propMap.get(name);
      if (existing) {
        // Already have type info from interface, just update required
        existing.required = true; // destructured params don't show optional markers, so assume required
      }
    }
  }

  // If we didn't find an interface, create props from destructured params
  if (propMap.size === 0) {
    const destructuredSimple = content.match(/(?:function|const)\s+\w+\s*(?:=\s*(?:\([^)]*\)\s*=>|\([^)]*\)\s*=>\s*\{)?)?[^{]*?\(\s*\{\s*([^}]+)\s*\}/s);
    if (destructuredSimple) {
      const paramStr = destructuredSimple[1];
      const paramEntries = paramStr.split(',').map((s) => s.trim()).filter(Boolean);
      for (const entry of paramEntries) {
        const name = entry.split(':')[0].trim();
        if (name) {
          propMap.set(name, { type: 'unknown', required: true, defaultValue: null });
        }
      }
    }
  }

  // Convert map to array
  for (const [name, info] of propMap) {
    props.push({
      name,
      type: info.type,
      required: info.required,
      defaultValue: info.defaultValue,
    });
  }

  return props;
}

/**
 * Detect the semantic type of a component.
 */
function detectComponentType(content: string, filePath: string): ComponentNode['type'] {
  const basenameLower = basename(filePath).toLowerCase();

  // Layout components
  if (
    basenameLower.includes('layout') ||
    basenameLower.includes('wrapper') ||
    basenameLower.includes('shell') ||
    basenameLower.includes('container') ||
    (content.includes('children') && content.includes('{children}'))
  ) {
    return 'layout';
  }

  // Container components (have state/hooks)
  if (
    content.match(/useState\s*\(/) ||
    content.match(/useEffect\s*\(/) ||
    content.match(/useReducer\s*\(/) ||
    content.match(/useContext\s*\(/) ||
    content.match(/createSignal\s*\(/) ||
    content.match(/createEffect\s*\(/)
  ) {
    return 'container';
  }

  // UI components (simple render-focused)
  if (
    content.match(/return\s*\(?\s*</) ||
    content.match(/^\s*</) ||
    content.includes('return <')
  ) {
    return 'ui';
  }

  return 'unknown';
}

/**
 * Extract named/default exports from file content.
 */
function extractExports(content: string): string[] {
  const exports: string[] = [];

  const defaultFuncMatch = content.match(/export\s+default\s+function\s+(\w+)/);
  if (defaultFuncMatch) exports.push(defaultFuncMatch[1]);

  const funcMatches = content.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g);
  for (const m of funcMatches) {
    if (!exports.includes(m[1])) exports.push(m[1]);
  }

  const constMatches = content.matchAll(/export\s+const\s+(\w+)/g);
  for (const m of constMatches) {
    if (!exports.includes(m[1])) exports.push(m[1]);
  }

  if (content.match(/export\s+default\s+(?!function)/)) {
    exports.push('default');
  }

  return exports;
}

/**
 * Detect if a component declares slots/children.
 */
function detectSlots(content: string, framework: string): boolean {
  if (framework === 'astro') {
    return content.includes('<slot') || content.includes('Astro.slot');
  }
  if (framework === 'react') {
    return content.includes('children') || content.includes('PropsWithChildren');
  }
  if (framework === 'vue') {
    return content.includes('<slot');
  }
  if (framework === 'svelte') {
    return content.includes('<slot');
  }
  return false;
}

/**
 * Observes UI components in a source repository.
 *
 * Scans `src/components/`, `src/ui/`, and `src/widgets/` directories
 * for component files matching common framework conventions.
 *
 * @param sourcePath - Absolute or relative path to the repository root.
 * @returns Array of detected ComponentNode objects.
 */
export async function observeComponents(sourcePath: string): Promise<ComponentNode[]> {
  const absPath = resolve(sourcePath);

  const scanDirs = ['src/components', 'src/ui', 'src/widgets'];

  const allFiles: string[] = [];
  for (const dir of scanDirs) {
    const pattern = `${dir}/**/*.{tsx,jsx,vue,svelte,astro}`;
    try {
      const files = await glob(pattern, {
        cwd: absPath,
        absolute: false,
      });
      allFiles.push(...files);
    } catch {
      // directory doesn't exist — skip
    }
  }

  // Deduplicate and sort for determinism
  const uniqueFiles = [...new Set(allFiles)].sort();

  const components: ComponentNode[] = [];

  for (const filePath of uniqueFiles) {
    const absFilePath = resolve(absPath, filePath);
    let content = '';
    try {
      content = readFileSync(absFilePath, 'utf-8');
    } catch {
      continue;
    }

    const name = basename(filePath, extname(filePath));
    const framework = detectFramework(filePath);
    const type = detectComponentType(content, filePath);
    const props = extractProps(content, filePath);
    const exports = extractExports(content);
    const hasSlots = detectSlots(content, framework);
    const id = stableId('ob', filePath);

    components.push({
      id,
      filePath,
      name,
      type,
      framework,
      props,
      exports,
      usedBy: [],
      styles: [],
      imports: [],
      hasSlots,
    });
  }

  return components;
}
