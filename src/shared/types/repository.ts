// ============================================================================
// Repository Model — Technology-independent snapshot of a source repository.
// Aligned with: docs/08-nexus-roadmap.md § Epic 1 — RepositoryModel Schema
// ============================================================================

// ---- Metadata ----

/**
 * Top-level metadata about the observed repository.
 * Aligned with the roadmap spec; extra fields `scanDurationMs` and `language`
 * are preserved because they carry operational observability not captured by
 * the spec.
 */
export interface RepositoryMetadata {
  /** Human-readable project name (from package.json or directory name). */
  name: string;
  /** Absolute path to the repository root at observation time. */
  rootPath: string;
  /** Detected front-end framework. */
  framework: 'react' | 'vue' | 'astro' | 'svelte' | 'unknown';
  /** Primary styling approach used by the project. */
  stylingApproach: 'tailwind' | 'css-modules' | 'styled-components' | 'scss' | 'css' | 'mixed';
  /** Primary programming language used. (extra — not in roadmap spec) */
  language: 'typescript' | 'javascript' | 'mixed';
  /** Total number of files scanned. */
  fileCount: number;
  /** Total number of pages detected. */
  totalPages: number;
  /** Total number of components detected. */
  totalComponents: number;
  /** ISO 8601 timestamp of when the analysis was performed. */
  analyzedAt: string;
  /** Observer version string (e.g. "nexus-observer/1.0.0"). */
  version: string;
  /** Wall-clock duration of the scan in milliseconds. (extra — not in roadmap spec) */
  scanDurationMs: number;
}

// ---- Node types ----

/**
 * Represents a page, layout, or template file discovered in the repository.
 */
export interface PageNode {
  /** Unique identifier for this node. */
  id: string;
  /** File path relative to the repository root. */
  filePath: string;
  /** Human-readable name derived from the file. */
  name: string;
  /** Classification of the page file. */
  type: 'page' | 'layout' | 'template';
  /** Framework this page uses (e.g. 'astro', 'react'). */
  framework: string;
  /** Parsed route if detectable, null otherwise. */
  route: string | null;
  /** Layout file ID if this page is nested within a layout. (extra) */
  layout: string | null;
  /** ComponentNode IDs used on this page. */
  childComponents: string[];
  /** ImportNode IDs for imports declared in this file. (extra — beyond spec) */
  imports: string[];
  /** Whether this is the root/index page. (extra) */
  isRoot: boolean;
  /** Named/default exports from this file. */
  exports: string[];
  /** Data-fetching pattern detected in this page, if any. */
  dataFetching: DataFetchingNode | null;
}

/**
 * Represents a UI component discovered in the repository.
 */
export interface ComponentNode {
  /** Unique identifier for this node. */
  id: string;
  /** File path relative to the repository root. */
  filePath: string;
  /** Component name (derived from the file or export). */
  name: string;
  /** Semantic classification of the component. */
  type: 'ui' | 'container' | 'layout' | 'unknown';
  /** Framework this component uses. */
  framework: string;
  /** Props accepted by this component. */
  props: PropNode[];
  /** Named/default exports from this file. */
  exports: string[];
  /** Page/Component IDs that import this component. */
  usedBy: string[];
  /** StyleNode IDs associated with this component. */
  styles: string[];
  /** ImportNode IDs for imports in this file. (extra — beyond spec) */
  imports: string[];
  /** Whether this component declares slots/children. (extra) */
  hasSlots: boolean;
}

/**
 * Describes a single prop accepted by a component.
 */
export interface PropNode {
  /** Prop name. */
  name: string;
  /** Inferred or explicit TypeScript type. */
  type: string;
  /** Whether the prop is required. */
  required: boolean;
  /** Default value, if any. */
  defaultValue: unknown | null;
}

/**
 * Represents a route detected in the repository.
 */
export interface RouteNode {
  /** Unique identifier for this node. */
  id: string;
  /** URL pattern (e.g. "/products/[id]"). */
  path: string;
  /** PageNode ID this route maps to. */
  pageId: string;
  /** How this route was discovered. */
  method: 'get' | 'static';
  /** Dynamic route parameters (e.g. ['id', 'slug']). */
  params: string[];
  /** Nested child route IDs. (extra — beyond spec) */
  children: string[];
}

/**
 * Represents an import statement discovered in the repository.
 * Reconciled between the current detailed model and the spec's simpler model.
 * `importedNames` is kept as a flat string array per spec; the richer
 * `ImportedSymbol` structure (with alias, isTypeOnly) is dropped in favor of
 * spec alignment.
 */
export interface ImportNode {
  /** Unique identifier for this node. */
  id: string;
  /** File where the import statement appears. */
  sourceFile: string;
  /** Module being imported (package name or relative path). */
  targetModule: string;
  /** Kind of import statement. */
  importType: 'default' | 'named' | 'namespace' | 'side-effect';
  /** Names imported from the target module. */
  importedNames: string[];
  /** Whether the target is external (node_modules) or project-local. */
  isExternal: boolean;
}

/**
 * Represents a style file or inline style block discovered in the repository.
 */
export interface StyleNode {
  /** Unique identifier for this node. */
  id: string;
  /** File path relative to the repository root. */
  filePath: string;
  /** Styling approach used. */
  type: 'css' | 'scss' | 'tailwind' | 'css-in-js' | 'inline';
  /** ComponentNode ID this style is associated with, if any. */
  associatedComponent: string | null;
  /** Number of design tokens extracted from this style source. */
  tokenCount: number;
  /** Raw tokens extracted before normalization. */
  rawTokens: RawToken[];
  /** CSS custom property / variable names found. (extra — beyond spec) */
  variables: string[];
  /** Utility classes found (Tailwind, etc.). (extra — beyond spec) */
  classes: string[];
  /** File this style block originates from (may differ from filePath for inline styles). (extra) */
  sourceFile: string;
}

/**
 * A raw, un-normalized token extracted from a style source.
 */
export interface RawToken {
  /** Original token name (e.g. "--color-primary"). */
  name: string;
  /** Original token value (e.g. "#ff0000", "1rem"). */
  value: string;
  /** Line number where the token was found. */
  line: number;
}

/**
 * Represents a design token extracted and normalized from the repository.
 */
export interface TokenNode {
  /** Unique identifier for this node. */
  id: string;
  /** Human-readable token name (e.g. "primary", "spacing-4"). */
  name: string;
  /** Original raw value from the source. */
  value: string;
  /** Semantic category of the token. */
  category: 'color' | 'spacing' | 'typography' | 'radius' | 'shadow' | 'custom';
  /** File where this token was discovered. */
  sourceFile: string;
  /** Line number where the token was found. */
  sourceLine: number;
  /** Post-normalization name (e.g. "--color-primary-color" → "primary"). */
  normalizedName: string;
  /** Normalized value: HSL for colors, rem for spacing, etc. (extra — beyond spec) */
  normalizedValue: string;
}

/**
 * Describes a data-fetching pattern detected in a page or component.
 */
export interface DataFetchingNode {
  /** Recognized data-fetching pattern. */
  pattern: 'useEffect+fetch' | 'getStaticProps' | 'loader' | 'Astro.fetch' | 'unknown';
  /** API endpoints called by this pattern. */
  endpoints: string[];
}

/**
 * Represents an API endpoint / fetch call detected in the repository.
 */
export interface ApiNode {
  /** Unique identifier for this node. */
  id: string;
  /** Full URL or URL pattern of the API endpoint. */
  url: string;
  /** HTTP method. */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** Page/Component IDs that consume this endpoint. */
  usedBy: string[];
  /** Rudimentary inferred response shape, if detectable. */
  responseShape: string | null;
}

// ---- Repository Model ----

/**
 * Complete technology-independent snapshot of a source repository.
 * This is the primary output of the Observer stage (Epic 1).
 */
export interface RepositoryModel {
  metadata: RepositoryMetadata;
  pages: PageNode[];
  components: ComponentNode[];
  routes: RouteNode[];
  imports: ImportNode[];
  styles: StyleNode[];
  tokens: TokenNode[];
  apis: ApiNode[];
}
