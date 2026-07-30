import { performance } from 'node:perf_hooks';
import type { RepositoryModel, ApiNode } from '../shared/types/repository.js';
import type { RepositoryManifest } from '../shared/types/manifest.js';
import { detectFramework } from './framework-detector.js';
import { observePages } from './page-observer.js';
import { observeComponents } from './component-observer.js';
import { observeImports } from './import-observer.js';
import { observeRoutes } from './route-observer.js';
import { observeCSS } from './css-observer.js';
import { enrichReferences } from './reference-linker.js';
import { createManifest } from '../shared/manifest-io.js';

// ============================================================================
// Observer Orchestrator — coordinates all observers and merges results
// ============================================================================

/**
 * Observes a source repository and produces a technology-independent RepositoryModel.
 * This is a pure analysis function — it reads files, never mutates them.
 *
 * Orchestration order:
 *   1. detectFramework  → metadata (framework, styling, language, file count)
 *   2. observePages     → PageNode[]
 *   3. observeComponents → ComponentNode[]
 *   4. observeImports   → ImportNode[] (needs pages + components for source files)
 *   5. observeRoutes    → RouteNode[] (needs pages)
 *   6. observeCSS       → { styles: StyleNode[], tokens: TokenNode[] }
 *   7. enrichReferences → cross-link all node types
 *   8. api-observer     → stub (returns [])
 *
 * @param sourcePath - Absolute or relative path to the source repository root.
 * @returns A complete RepositoryModel describing all detected artifacts.
 */
export async function observeRepository(sourcePath: string): Promise<RepositoryModel> {
  const startTime = performance.now();

  // 1. Detect framework & metadata
  const metadata = await detectFramework(sourcePath);

  // 2. Observe pages
  const pages = await observePages(sourcePath);

  // 3. Observe components
  const components = await observeComponents(sourcePath);

  // 4. Observe imports (needs pages + components for source files)
  const imports = await observeImports(sourcePath, pages, components);

  // 5. Observe routes (needs pages)
  const routes = await observeRoutes(sourcePath, pages);

  // 6. Observe CSS (existing)
  const { styles, tokens } = await observeCSS(sourcePath);

  // 7. Enrich cross-references
  enrichReferences(pages, components, imports, styles);

  // 8. API observation — stub for now
  const apis: ApiNode[] = [];

  // Update metadata with actual counts
  metadata.totalPages = pages.length;
  metadata.totalComponents = components.length;
  metadata.scanDurationMs = Math.round(performance.now() - startTime);

  return { metadata, pages, components, routes, imports, styles, tokens, apis };
}

/**
 * Observe a source repository and produce a complete RepositoryManifest
 * with embedded SHA-256 checksums for determinism verification.
 *
 * This is a convenience wrapper around observeRepository() + createManifest().
 *
 * @param sourcePath - Absolute or relative path to the source repository root.
 * @returns A complete RepositoryManifest with checksums.
 */
export async function observeManifest(sourcePath: string): Promise<RepositoryManifest> {
  const model = await observeRepository(sourcePath);
  return createManifest(sourcePath, model.metadata, model);
}
