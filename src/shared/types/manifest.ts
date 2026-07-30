import type { RepositoryModel, RepositoryMetadata } from './repository.js';
import type { KnowledgeModel } from './knowledge.js';
import type { ApplicationDefinition, PageDefinition, WidgetDefinition } from './definitions.js';

// Re-export all types from sibling modules for convenience
export type { RepositoryModel, RepositoryMetadata };
export type { KnowledgeModel };
export type { ApplicationDefinition, PageDefinition, WidgetDefinition };

// Re-export the Zod schema from the standalone schema file
export { RepositoryManifestSchema } from './manifest.schema.js';

// ============================================================================
// RepositoryManifest — Universal interchange contract
// Aligned with: docs/08-nexus-roadmap.md § Epic 2 — RepositoryManifest Schema
// ============================================================================

/**
 * The RepositoryManifest is the universal contract between all Nexus subsystems
 * and external tools. It is versioned, validated, and carries provenance metadata.
 *
 * Every stage of the pipeline enriches a single manifest file:
 *   Observer    → populates repositoryModel
 *   Interpreter → populates knowledgeModel
 *   Definition  → populates definitions
 */
export interface RepositoryManifest {
  /** Semantic version of the manifest format (e.g. "1.0.0"). */
  schemaVersion: string;
  /** ISO 8601 timestamp of when this manifest was generated. */
  generatedAt: string;
  /** Identifies the tool/version that generated this manifest (e.g. "nexus-observer/1.0.0"). */
  generatedBy: string;
  /** Absolute path to the source repository at observation time. */
  sourcePath: string;

  /** Top-level repository metadata (embedded for quick access). */
  metadata: RepositoryMetadata;
  /** Complete technology-independent repository snapshot. */
  repositoryModel: RepositoryModel;

  /** Semantic knowledge model — null until Epic 3 (Interpretation). */
  knowledgeModel: KnowledgeModel | null;

  /** Structured definitions — null until Epic 5 (Definition Generator). */
  definitions: {
    application: ApplicationDefinition | null;
    pages: PageDefinition[];
    widgets: WidgetDefinition[];
  } | null;

  /** Independent SHA-256 checksums for each model section. */
  checksums: {
    repositoryModel: string;
    knowledgeModel: string | null;
    definitions: string | null;
  };
}
