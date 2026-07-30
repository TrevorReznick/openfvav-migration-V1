// ============================================================================
// Zod Validation Schema — RepositoryManifest
// Aligned with: src/shared/types/manifest.ts
// ============================================================================

import { z } from 'zod';
import { RepositoryMetadataSchema, RepositoryModelSchema } from './repository.schema.js';
import { KnowledgeModelSchema } from './knowledge.schema.js';
import {
  ApplicationDefinitionSchema,
  PageDefinitionSchema,
  WidgetDefinitionSchema,
} from './definitions.schema.js';

/**
 * Zod schema for the RepositoryManifest — the universal contract between all
 * Nexus subsystems and external tools. Provides deep field-level validation
 * for every nested model.
 */
export const RepositoryManifestSchema = z.object({
  schemaVersion: z.string(),
  generatedAt: z.string().datetime(),
  generatedBy: z.string(),
  sourcePath: z.string(),

  metadata: RepositoryMetadataSchema,

  repositoryModel: RepositoryModelSchema,

  knowledgeModel: KnowledgeModelSchema.nullable(),

  definitions: z
    .object({
      application: ApplicationDefinitionSchema.nullable(),
      pages: z.array(PageDefinitionSchema),
      widgets: z.array(WidgetDefinitionSchema),
    })
    .nullable(),

  checksums: z.object({
    repositoryModel: z.string().length(64),
    knowledgeModel: z.string().length(64).nullable(),
    definitions: z.string().length(64).nullable(),
  }),
});
