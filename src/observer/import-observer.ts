import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import type { ImportNode, PageNode, ComponentNode } from '../shared/types/repository.js';

// ============================================================================
// Import Observer — parses import statements from pages and components
// ============================================================================

/**
 * Generate a stable ID for a node using SHA-256 hash.
 */
function stableId(prefix: string, input: string): string {
  return `${prefix}-${createHash('sha256').update(input).digest('hex').slice(0, 12)}`;
}

/**
 * Common known external package prefixes (not project-local).
 */
const EXTERNAL_PREFIXES = [
  'react', 'react-dom', 'next', 'vue', 'svelte', 'astro',
  '@astrojs', '@next', '@sveltejs', '@vue',
  'tailwindcss', 'styled-components', '@emotion',
  'lodash', 'axios', 'date-fns', 'zod', 'chalk',
  'commander', 'glob', 'inquirer',
];

/**
 * Determine if an import target is external (node_modules) or project-local.
 */
function isExternalImport(target: string): boolean {
  // Relative imports are always local
  if (target.startsWith('.') || target.startsWith('/')) {
    return false;
  }

  // Known external packages
  for (const prefix of EXTERNAL_PREFIXES) {
    if (target === prefix || target.startsWith(prefix + '/')) {
      return true;
    }
  }

  // Check if it looks like a scoped package (@scope/name)
  if (target.startsWith('@') && !target.startsWith('@/')) {
    return true;
  }

  // If it doesn't look like a path (no dots, no slashes for native modules),
  // treat as external
  if (!target.includes('/') && !target.includes('.')) {
    return true;
  }

  return false;
}

/**
 * Parse all import statements from source content.
 */
function parseImports(content: string, sourceFile: string): Omit<ImportNode, 'id'>[] {
  const imports: Omit<ImportNode, 'id'>[] = [];

  // For Astro files, extract the frontmatter (where imports live) and also scan the
  // template portion (which may contain inline scripts with imports)
  let scanContent = content;
  if (content.startsWith('---')) {
    const endFence = content.indexOf('\n---', 3);
    if (endFence !== -1) {
      // Include the frontmatter (where imports go in .astro files) AND the body
      // The frontmatter is content[3..endFence], body starts after endFence+4
      const frontmatter = content.slice(3, endFence);
      const body = content.slice(endFence + 4);
      scanContent = frontmatter + '\n' + body;
    }
  }

  // Match lines that start with 'import' (possibly preceded by whitespace)
  const lines = scanContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip non-import lines
    if (!trimmed.startsWith('import ')) continue;

    // Skip if inside comments
    if (trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;

    try {
      // import 'module' (side-effect)
      const sideEffectMatch = trimmed.match(/^import\s+['"]([^'"]+)['"]/);
      if (sideEffectMatch && !trimmed.includes(' from ')) {
        const target = sideEffectMatch[1];
        const id = stableId('ob', `${sourceFile}::${target}`);
        imports.push({
          sourceFile,
          targetModule: target,
          importType: 'side-effect',
          importedNames: [],
          isExternal: isExternalImport(target),
        });
        continue;
      }

      // import * as X from 'module' (namespace)
      const namespaceMatch = trimmed.match(/^import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/);
      if (namespaceMatch) {
        const [, name, target] = namespaceMatch;
        const id = stableId('ob', `${sourceFile}::${target}`);
        imports.push({
          sourceFile,
          targetModule: target,
          importType: 'namespace',
          importedNames: [name],
          isExternal: isExternalImport(target),
        });
        continue;
      }

      // import X from 'module' (default)
      const defaultMatch = trimmed.match(/^import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/);
      if (defaultMatch) {
        const [, name, target] = defaultMatch;
        const id = stableId('ob', `${sourceFile}::${target}`);
        imports.push({
          sourceFile,
          targetModule: target,
          importType: 'default',
          importedNames: [name],
          isExternal: isExternalImport(target),
        });
        continue;
      }

      // import { X, Y } from 'module' (named)
      const namedMatch = trimmed.match(/^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/);
      if (namedMatch) {
        const [, namesStr, target] = namedMatch;
        const names = namesStr
          .split(',')
          .map((n: string) => n.trim())
          .filter(Boolean)
          .map((n: string) => {
            // Handle 'X as Y' aliases — take the original name
            const asParts = n.split(/\s+as\s+/);
            return asParts[0].trim();
          });
        const id = stableId('ob', `${sourceFile}::${target}`);
        imports.push({
          sourceFile,
          targetModule: target,
          importType: 'named',
          importedNames: names,
          isExternal: isExternalImport(target),
        });
        continue;
      }

      // import X, { Y, Z } from 'module' (default + named)
      const mixedMatch = trimmed.match(/^import\s+(\w+)\s*,\s*\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/);
      if (mixedMatch) {
        const [, defaultName, namesStr, target] = mixedMatch;
        const names = namesStr
          .split(',')
          .map((n: string) => n.trim())
          .filter(Boolean)
          .map((n: string) => {
            const asParts = n.split(/\s+as\s+/);
            return asParts[0].trim();
          });
        // Treat as two separate import nodes for clarity
        const id1 = stableId('ob', `${sourceFile}::${target}::default`);
        imports.push({
          sourceFile,
          targetModule: target,
          importType: 'default',
          importedNames: [defaultName],
          isExternal: isExternalImport(target),
        });
        const id2 = stableId('ob', `${sourceFile}::${target}::named`);
        imports.push({
          sourceFile,
          targetModule: target,
          importType: 'named',
          importedNames: names,
          isExternal: isExternalImport(target),
        });
        continue;
      }
    } catch {
      // Skip unparseable import lines
    }
  }

  return imports;
}

/**
 * Observes all import statements across pages and components.
 *
 * Reads each page and component file, parses its import statements,
 * and produces ImportNode objects describing the import graph.
 *
 * @param sourcePath - Absolute or relative path to the repository root.
 * @param pages - Pre-observed page nodes (used as source files).
 * @param components - Pre-observed component nodes (used as source files).
 * @returns Array of ImportNode objects.
 */
export async function observeImports(
  sourcePath: string,
  pages: PageNode[],
  components: ComponentNode[]
): Promise<ImportNode[]> {
  const absPath = resolve(sourcePath);
  const allImports: ImportNode[] = [];
  const seen = new Set<string>();

  // Collect all source files to scan
  const sourceFiles: string[] = [
    ...pages.map((p) => p.filePath),
    ...components.map((c) => c.filePath),
  ];

  for (const relPath of sourceFiles) {
    const absFilePath = resolve(absPath, relPath);
    let content: string;
    try {
      content = readFileSync(absFilePath, 'utf-8');
    } catch {
      continue;
    }

    const fileImports = parseImports(content, relPath);

    for (const imp of fileImports) {
      const id = stableId('ob', `${imp.sourceFile}::${imp.targetModule}::${imp.importType}`);
      const fullImp: ImportNode = { ...imp, id };

      if (!seen.has(id)) {
        seen.add(id);
        allImports.push(fullImp);
      }
    }
  }

  return allImports;
}
