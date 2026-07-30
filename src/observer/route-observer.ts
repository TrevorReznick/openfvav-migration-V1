import { createHash } from 'node:crypto';
import type { RouteNode, PageNode } from '../shared/types/repository.js';

// ============================================================================
// Route Observer — derives RouteNodes from PageNodes
// ============================================================================

/**
 * Generate a stable ID for a node using SHA-256 hash.
 */
function stableId(prefix: string, input: string): string {
  return `${prefix}-${createHash('sha256').update(input).digest('hex').slice(0, 12)}`;
}

/**
 * Extract dynamic route parameters from a route path.
 *
 * Examples:
 *   "/blog/[slug]"          → ["slug"]
 *   "/blog/[...rest]"       → ["rest"]
 *   "/products/[id]/[page]" → ["id", "page"]
 *   "/about"                → []
 */
function extractParams(routePath: string): string[] {
  const params: string[] = [];
  // Match :param, *param (converted from [param], [...param])
  const matches = routePath.matchAll(/:(\w+)|\*(\w+)/g);
  for (const m of matches) {
    const param = m[1] || m[2];
    if (param && !params.includes(param)) {
      params.push(param);
    }
  }
  return params;
}

/**
 * Convert [param] style route to :param style for the RouteNode.
 * This normalizes framework-specific syntax to a unified pattern.
 */
function normalizeRoutePath(routePath: string): string {
  return routePath
    .replace(/\[\.{3}(\w+)\]/g, '*$1')
    .replace(/\[(\w+)\]/g, ':$1');
}

/**
 * Derive RouteNodes from an array of PageNodes.
 *
 * Each page is mapped to a RouteNode with the appropriate path,
 * HTTP method, and dynamic parameters.
 *
 * @param sourcePath - Absolute or relative path to the repository root (unused, kept for API consistency).
 * @param pages - Pre-observed page nodes.
 * @returns Array of RouteNode objects.
 */
export async function observeRoutes(_sourcePath: string, pages: PageNode[]): Promise<RouteNode[]> {
  const routes: RouteNode[] = [];

  for (const page of pages) {
    const routePath = page.route ?? '/';
    const normalizedPath = normalizeRoutePath(routePath);
    const params = extractParams(normalizedPath);
    const id = stableId('ob', `route:${normalizedPath}`);

    // Detect if it's a static route (SSG/SSR prerender indication)
    // For now, all routes are 'get' unless they have getStaticProps pattern
    // In a future sprint, we'd read the file to detect export const prerender = true
    let method: RouteNode['method'] = 'get';
    if (page.dataFetching?.pattern === 'getStaticProps') {
      method = 'static';
    }

    routes.push({
      id,
      path: normalizedPath,
      pageId: page.id,
      method,
      params,
      children: [],
    });
  }

  return routes;
}
