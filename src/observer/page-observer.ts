import { readFileSync } from 'node:fs';
import { basename, dirname, extname, relative, resolve } from 'node:path';
import { glob } from 'glob';
import { createHash } from 'node:crypto';
import type { PageNode, DataFetchingNode } from '../shared/types/repository.js';

// ============================================================================
// Page Observer — detects pages, layouts, templates from file structure
// ============================================================================

/**
 * Generate a stable ID for a node using SHA-256 hash.
 */
function stableId(prefix: string, input: string): string {
  return `${prefix}-${createHash('sha256').update(input).digest('hex').slice(0, 12)}`;
}

/**
 * Map file extension to framework label.
 */
function extToFramework(ext: string): string {
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
 * Derive a route path from a page file path.
 *
 * Examples:
 *   src/pages/index.astro       → /
 *   src/pages/about.astro       → /about
 *   src/pages/blog/[slug].astro → /blog/:slug
 *   src/pages/blog/[...rest].astro → /blog/*rest
 *   src/app/dashboard/page.tsx  → /dashboard
 *   src/app/page.tsx            → /
 *   src/app/layout.tsx          → /
 */
function filePathToRoute(filePath: string): string {
  // Normalize
  let route = filePath.replace(/\\/g, '/');

  // Strip src/pages/ or src/app/
  const pagesMatch = route.match(/src\/pages\/(.*)/);
  const appMatch = route.match(/src\/app\/(.*)/);

  let relativePath: string;
  if (pagesMatch) {
    relativePath = pagesMatch[1];
  } else if (appMatch) {
    relativePath = appMatch[1];
  } else {
    return '/';
  }

  // Remove file extensions
  relativePath = relativePath.replace(/\.(astro|tsx|jsx|mdx|vue|svelte)$/, '');

  // Remove route group segments like (group)/
  relativePath = relativePath.replace(/\([^)]+\)\//g, '');

  // Handle special file names (Next.js App Router conventions)
  const parts = relativePath.split('/');
  const lastPart = parts[parts.length - 1];

  if (lastPart === 'page' || lastPart === 'index' || lastPart === 'layout' || lastPart === 'template') {
    parts.pop(); // remove the special name
  }

  // Remove empty segments
  const filtered = parts.filter(Boolean);

  // Convert [param] → :param, [...rest] → *rest
  const converted = filtered.map((seg) => {
    if (seg.startsWith('[...') && seg.endsWith(']')) {
      return '*' + seg.slice(4, -1);
    }
    if (seg.startsWith('[') && seg.endsWith(']')) {
      return ':' + seg.slice(1, -1);
    }
    return seg;
  });

  return '/' + converted.join('/');
}

/**
 * Detect the page type from the filename.
 */
function detectPageType(filePath: string): PageNode['type'] {
  const base = basename(filePath).toLowerCase();
  if (base.includes('layout')) return 'layout';
  if (base.includes('template')) return 'template';
  return 'page';
}

/**
 * Extract named/default exports from file content.
 */
function extractExports(content: string): string[] {
  const exports: string[] = [];

  // export default function Foo
  const defaultFuncMatch = content.match(/export\s+default\s+function\s+(\w+)/);
  if (defaultFuncMatch) exports.push(defaultFuncMatch[1]);

  // export function Foo / export async function Foo
  const funcMatches = content.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g);
  for (const m of funcMatches) {
    if (!exports.includes(m[1])) exports.push(m[1]);
  }

  // export const Foo
  const constMatches = content.matchAll(/export\s+const\s+(\w+)/g);
  for (const m of constMatches) {
    if (!exports.includes(m[1])) exports.push(m[1]);
  }

  // export default (arrow/expression) — capture as 'default'
  if (content.match(/export\s+default\s+(?!function)/)) {
    exports.push('default');
  }

  return exports;
}

/**
 * Detect data-fetching patterns in page content.
 */
function detectDataFetching(content: string): DataFetchingNode | null {
  // Astro.props / Astro.fetch
  if (content.match(/Astro\.(props|fetch)/)) {
    const endpoints = extractEndpoints(content);
    return { pattern: 'Astro.fetch', endpoints };
  }

  // getStaticProps (Next.js pages router)
  if (content.match(/export\s+(async\s+)?function\s+getStaticProps/) || content.match(/getStaticProps/)) {
    const endpoints = extractEndpoints(content);
    return { pattern: 'getStaticProps', endpoints };
  }

  // loader (Astro content collections / Remix)
  if (content.match(/export\s+(async\s+)?function\s+loader\b/)) {
    const endpoints = extractEndpoints(content);
    return { pattern: 'loader', endpoints };
  }

  // useEffect + fetch pattern
  if (content.match(/useEffect\s*\(/) && content.match(/fetch\s*\(/)) {
    const endpoints = extractEndpoints(content);
    return { pattern: 'useEffect+fetch', endpoints };
  }

  // Generic fetch without useEffect
  const fetchMatches = content.matchAll(/fetch\s*\(\s*['"]([^'"]+)['"]/g);
  const fetchEndpoints: string[] = [];
  for (const m of fetchMatches) {
    fetchEndpoints.push(m[1]);
  }
  if (fetchEndpoints.length > 0) {
    return { pattern: 'unknown', endpoints: fetchEndpoints };
  }

  return null;
}

/**
 * Extract URL endpoints from a source string.
 */
function extractEndpoints(content: string): string[] {
  const endpoints: string[] = [];
  const matches = content.matchAll(/fetch\s*\(\s*['"]([^'"]+)['"]/g);
  for (const m of matches) {
    endpoints.push(m[1]);
  }
  // Also check for URL variables
  const urlVarMatches = content.matchAll(/['"](https?:\/\/[^'"]+)['"]/g);
  for (const m of urlVarMatches) {
    if (!endpoints.includes(m[1])) endpoints.push(m[1]);
  }
  return endpoints;
}

/**
 * Determine if a page is the root/index page.
 */
function isRootPage(filePath: string): boolean {
  const base = basename(filePath).toLowerCase();
  const withoutExt = base.replace(/\.[^.]+$/, '');
  if (withoutExt === 'index' || withoutExt === 'page') {
    // Check if it's at the top level of pages or app
    const dir = dirname(filePath).replace(/\\/g, '/');
    return dir.endsWith('/pages') || dir.endsWith('/app') || dir.endsWith('/src/pages') || dir.endsWith('/src/app');
  }
  return false;
}

/**
 * Detect the framework from the file extension.
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
 * Observes pages, layouts, and templates in a source repository.
 *
 * Scans `src/pages/` and `src/app/` directories for page files
 * matching common framework conventions (Astro, Next.js, SvelteKit, etc.).
 *
 * @param sourcePath - Absolute or relative path to the repository root.
 * @returns Array of detected PageNode objects.
 */
export async function observePages(sourcePath: string): Promise<PageNode[]> {
  const absPath = resolve(sourcePath);

  // Globs for pages
  const pagePatterns = [
    'src/pages/**/*.{astro,tsx,jsx,mdx,vue,svelte}',
    'src/app/**/{page,layout,template}.{tsx,jsx}',
    'src/app/**/page.{tsx,jsx}',
    'src/app/**/layout.{tsx,jsx}',
    'src/app/**/template.{tsx,jsx}',
  ];

  const allFiles: string[] = [];
  for (const pattern of pagePatterns) {
    try {
      const files = await glob(pattern, {
        cwd: absPath,
        absolute: false,
      });
      allFiles.push(...files);
    } catch {
      // pattern didn't match — skip
    }
  }

  // Deduplicate and sort for determinism
  const uniqueFiles = [...new Set(allFiles)].sort();

  const pages: PageNode[] = [];

  for (const filePath of uniqueFiles) {
    const absFilePath = resolve(absPath, filePath);
    let content = '';
    try {
      content = readFileSync(absFilePath, 'utf-8');
    } catch {
      continue;
    }

    const route = filePathToRoute(filePath);
    const type = detectPageType(filePath);
    const framework = detectFramework(filePath);
    const exports = extractExports(content);
    const dataFetching = detectDataFetching(content);
    const name = basename(filePath, extname(filePath));
    const root = isRootPage(filePath);
    const id = stableId('ob', filePath);

    pages.push({
      id,
      filePath,
      name,
      type,
      framework,
      route,
      layout: null,
      childComponents: [],
      imports: [],
      isRoot: root,
      exports,
      dataFetching,
    });
  }

  return pages;
}
