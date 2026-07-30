// ============================================================================
// Zod Validation Schemas — RepositoryModel types
// Aligned with: src/shared/types/repository.ts
// ============================================================================

import { z } from 'zod';

// ---- Raw Token ----

/** Zod schema for a raw, un-normalized token extracted from a style source. */
export const RawTokenSchema = z.object({
  name: z.string(),
  value: z.string(),
  line: z.number(),
});

// ---- Data Fetching Node ----

/** Zod schema for a data-fetching pattern detected in a page or component. */
export const DataFetchingNodeSchema = z.object({
  pattern: z.enum(['useEffect+fetch', 'getStaticProps', 'loader', 'Astro.fetch', 'unknown']),
  endpoints: z.array(z.string()),
});

// ---- Prop Node ----

/** Zod schema for a single prop accepted by a component. */
export const PropNodeSchema = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean(),
  defaultValue: z.unknown().nullable(),
});

// ---- Page Node ----

/** Zod schema for a page, layout, or template file discovered in the repository. */
export const PageNodeSchema = z.object({
  id: z.string(),
  filePath: z.string(),
  name: z.string(),
  type: z.enum(['page', 'layout', 'template']),
  framework: z.string(),
  route: z.string().nullable(),
  layout: z.string().nullable(),
  childComponents: z.array(z.string()),
  imports: z.array(z.string()),
  isRoot: z.boolean(),
  exports: z.array(z.string()),
  dataFetching: DataFetchingNodeSchema.nullable(),
});

// ---- Component Node ----

/** Zod schema for a UI component discovered in the repository. */
export const ComponentNodeSchema = z.object({
  id: z.string(),
  filePath: z.string(),
  name: z.string(),
  type: z.enum(['ui', 'container', 'layout', 'unknown']),
  framework: z.string(),
  props: z.array(PropNodeSchema),
  exports: z.array(z.string()),
  usedBy: z.array(z.string()),
  styles: z.array(z.string()),
  imports: z.array(z.string()),
  hasSlots: z.boolean(),
});

// ---- Route Node ----

/** Zod schema for a route detected in the repository. */
export const RouteNodeSchema = z.object({
  id: z.string(),
  path: z.string(),
  pageId: z.string(),
  method: z.enum(['get', 'static']),
  params: z.array(z.string()),
  children: z.array(z.string()),
});

// ---- Import Node ----

/** Zod schema for an import statement discovered in the repository. */
export const ImportNodeSchema = z.object({
  id: z.string(),
  sourceFile: z.string(),
  targetModule: z.string(),
  importType: z.enum(['default', 'named', 'namespace', 'side-effect']),
  importedNames: z.array(z.string()),
  isExternal: z.boolean(),
});

// ---- Style Node ----

/** Zod schema for a style file or inline style block discovered in the repository. */
export const StyleNodeSchema = z.object({
  id: z.string(),
  filePath: z.string(),
  type: z.enum(['css', 'scss', 'tailwind', 'css-in-js', 'inline']),
  associatedComponent: z.string().nullable(),
  tokenCount: z.number(),
  rawTokens: z.array(RawTokenSchema),
  variables: z.array(z.string()),
  classes: z.array(z.string()),
  sourceFile: z.string(),
});

// ---- Token Node ----

/** Zod schema for a design token extracted and normalized from the repository. */
export const TokenNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.string(),
  category: z.enum(['color', 'spacing', 'typography', 'radius', 'shadow', 'custom']),
  sourceFile: z.string(),
  sourceLine: z.number(),
  normalizedName: z.string(),
  normalizedValue: z.string(),
});

// ---- Api Node ----

/** Zod schema for an API endpoint / fetch call detected in the repository. */
export const ApiNodeSchema = z.object({
  id: z.string(),
  url: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  usedBy: z.array(z.string()),
  responseShape: z.string().nullable(),
});

// ---- Repository Metadata ----

/** Zod schema for top-level metadata about the observed repository. */
export const RepositoryMetadataSchema = z.object({
  name: z.string(),
  rootPath: z.string(),
  framework: z.enum(['react', 'vue', 'astro', 'svelte', 'unknown']),
  stylingApproach: z.enum(['tailwind', 'css-modules', 'styled-components', 'scss', 'css', 'mixed']),
  language: z.enum(['typescript', 'javascript', 'mixed']),
  fileCount: z.number(),
  totalPages: z.number(),
  totalComponents: z.number(),
  analyzedAt: z.string(),
  version: z.string(),
  scanDurationMs: z.number(),
});

// ---- Repository Model ----

/** Zod schema for the complete technology-independent snapshot of a source repository. */
export const RepositoryModelSchema = z.object({
  metadata: RepositoryMetadataSchema,
  pages: z.array(PageNodeSchema),
  components: z.array(ComponentNodeSchema),
  routes: z.array(RouteNodeSchema),
  imports: z.array(ImportNodeSchema),
  styles: z.array(StyleNodeSchema),
  tokens: z.array(TokenNodeSchema),
  apis: z.array(ApiNodeSchema),
});

/** Default export: the top-level RepositoryModel schema. */
export default RepositoryModelSchema;
