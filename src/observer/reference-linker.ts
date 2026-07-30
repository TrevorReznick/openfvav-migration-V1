import { basename, dirname, extname, resolve as resolvePath } from 'node:path';
import type { PageNode, ComponentNode, ImportNode, StyleNode } from '../shared/types/repository.js';

// ============================================================================
// Reference Linker — cross-links observer results by resolving references
// ============================================================================

/**
 * Normalize a file path for comparison (handle relative paths, no extension).
 */
function normalizeFilePath(fp: string): string {
  return fp.replace(/\\/g, '/').replace(/^\.\//, '');
}

/**
 * Resolve a relative import target to an absolute-style path that can be
 * matched against component file paths. For example:
 *   sourceFile = "src/pages/index.astro"
 *   targetModule = "../components/Layout.astro"
 *   → "src/components/Layout.astro"
 */
function resolveImportPath(sourceFile: string, targetModule: string): string {
  if (!targetModule.startsWith('.')) {
    return normalizeFilePath(targetModule);
  }
  const sourceDir = dirname(sourceFile).replace(/\\/g, '/');
  const resolved = resolvePath(sourceDir, targetModule).replace(/\\/g, '/');
  // Remove leading ./ if present
  return resolved.replace(/^\.\//, '');
}

/**
 * Enrich cross-references between pages, components, imports, and styles.
 *
 * This function mutates the arrays in-place to populate:
 *   - ComponentNode.usedBy (from imports)
 *   - ComponentNode.styles (from StyleNode matching)
 *   - StyleNode.associatedComponent (from component matching)
 *   - PageNode.childComponents (from imports)
 *
 * @param pages - All detected page nodes.
 * @param components - All detected component nodes.
 * @param imports - All detected import nodes.
 * @param styles - All detected style nodes.
 */
export function enrichReferences(
  pages: PageNode[],
  components: ComponentNode[],
  imports: ImportNode[],
  styles: StyleNode[]
): void {
  // Build lookup maps (keyed by normalized file path)
  const componentMap = new Map<string, ComponentNode>();
  for (const c of components) {
    componentMap.set(normalizeFilePath(c.filePath), c);
  }

  const pageMap = new Map<string, PageNode>();
  for (const p of pages) {
    pageMap.set(normalizeFilePath(p.filePath), p);
  }

  // Helper: find a component by its resolved path
  function findComponent(resolvedPath: string): ComponentNode | null {
    const norm = normalizeFilePath(resolvedPath);
    // Direct match
    let found = componentMap.get(norm);
    if (found) return found;
    // Try without extension
    const normNoExt = norm.replace(/\.[^.]+$/, '');
    for (const [compPath, comp] of componentMap) {
      const compNoExt = compPath.replace(/\.[^.]+$/, '');
      if (compNoExt === normNoExt) return comp;
    }
    // Try suffix match
    for (const [compPath, comp] of componentMap) {
      if (norm.endsWith(compPath) || compPath.endsWith(norm)) return comp;
      const compNoExt = compPath.replace(/\.[^.]+$/, '');
      const nNoExt = norm.replace(/\.[^.]+$/, '');
      if (nNoExt.endsWith(compNoExt) || compNoExt.endsWith(nNoExt)) return comp;
    }
    return null;
  }

  // Helper: find a page by its normalized file path
  function findPage(normSource: string): PageNode | null {
    let found = pageMap.get(normSource);
    if (found) return found;
    for (const [pagePath, page] of pageMap) {
      if (pagePath.endsWith(normSource) || normSource.endsWith(pagePath)) return page;
      const ppNoExt = pagePath.replace(/\.[^.]+$/, '');
      const nsNoExt = normSource.replace(/\.[^.]+$/, '');
      if (ppNoExt === nsNoExt || ppNoExt.endsWith(nsNoExt) || nsNoExt.endsWith(ppNoExt)) return page;
    }
    return null;
  }

  // --- Link component usedBy from imports ---
  for (const imp of imports) {
    if (imp.isExternal) continue;

    const resolvedTarget = resolveImportPath(imp.sourceFile, imp.targetModule);
    const targetComp = findComponent(resolvedTarget);

    if (targetComp && !targetComp.usedBy.includes(imp.sourceFile)) {
      targetComp.usedBy.push(imp.sourceFile);
    }
  }

  // --- Link styles to components ---
  for (const style of styles) {
    if (style.associatedComponent) continue; // already linked by css-observer

    const styleBasename = basename(style.filePath, extname(style.filePath));
    for (const comp of components) {
      const compBasename = basename(comp.filePath, extname(comp.filePath));
      if (
        styleBasename === compBasename ||
        styleBasename === compBasename + '.module' ||
        compBasename === styleBasename + '.module'
      ) {
        style.associatedComponent = comp.id;
        if (!comp.styles.includes(style.id)) {
          comp.styles.push(style.id);
        }
        break;
      }
    }
  }

  // --- Populate page childComponents ---
  for (const imp of imports) {
    if (imp.isExternal) continue;

    const normSource = normalizeFilePath(imp.sourceFile);
    const sourcePage = findPage(normSource);

    if (!sourcePage) continue;

    const resolvedTarget = resolveImportPath(imp.sourceFile, imp.targetModule);
    const targetComp = findComponent(resolvedTarget);

    if (targetComp && !sourcePage.childComponents.includes(targetComp.id)) {
      sourcePage.childComponents.push(targetComp.id);
    }
  }
}
