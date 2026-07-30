// ============================================================================
// Zod Validation Schemas — KnowledgeModel types
// Aligned with: src/shared/types/knowledge.ts
// ============================================================================

import { z } from 'zod';

// ---- Entity Attribute ----

/** Zod schema for a single attribute/field of an entity. */
export const EntityAttributeSchema = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean(),
  description: z.string().optional(),
});

// ---- Domain ----

/** Zod schema for a business domain identified in the repository. */
export const DomainSchema = z.object({
  id: z.string(),
  name: z.string(),
  confidence: z.number(),
  evidence: z.array(z.string()),
  description: z.string(),
  pages: z.array(z.string()),
  primaryEntities: z.array(z.string()),
});

// ---- Intent ----

/** Zod schema for a user intent served by one or more pages. */
export const IntentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['informational', 'transactional', 'navigational', 'functional']),
  servedBy: z.array(z.string()),
  confidence: z.number(),
  source: z.enum(['ai', 'rule', 'manual']),
  domain: z.string(),
  triggers: z.array(z.string()),
  entities: z.array(z.string()),
});

// ---- Entity ----

/** Zod schema for a domain entity discovered in the repository. */
export const EntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['model', 'view', 'controller', 'config', 'unknown']),
  sourceComponents: z.array(z.string()),
  attributes: z.array(EntityAttributeSchema),
  sourcePage: z.string(),
});

// ---- Relationship ----

/** Zod schema for a relationship between two entities. */
export const RelationshipSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  type: z.enum(['has-many', 'belongs-to', 'has-one', 'many-to-many', 'uses', 'extends']),
  via: z.string().optional(),
  confidence: z.number(),
  evidence: z.array(z.string()),
});

// ---- Pattern ----

/** Zod schema for a design or architecture pattern recognized in the repository. */
export const PatternSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['architecture', 'design', 'routing', 'data-flow']),
  locations: z.array(z.string()),
  confidence: z.number(),
  description: z.string(),
  pages: z.array(z.string()),
  archetype: z.string(),
});

// ---- Archetype Match ----

/** Zod schema for the result of matching the repository against a known archetype. */
export const ArchetypeMatchSchema = z.object({
  archetypeId: z.string(),
  archetypeName: z.string(),
  matchedPages: z.array(z.string()),
  matchedComponents: z.array(z.string()),
  confidence: z.number(),
  rationale: z.string(),
  matchEvidence: z.array(z.string()),
});

// ---- Knowledge Model ----

/** Zod schema for the top-level knowledge model produced by the Interpretation stage. */
export const KnowledgeModelSchema = z.object({
  generatedAt: z.string(),
  interpreterVersion: z.string(),
  confidence: z.number(),
  domains: z.array(DomainSchema),
  intents: z.array(IntentSchema),
  entities: z.array(EntitySchema),
  relationships: z.array(RelationshipSchema),
  patterns: z.array(PatternSchema),
  archetypes: z.array(ArchetypeMatchSchema),
});

/** Default export: the top-level KnowledgeModel schema. */
export default KnowledgeModelSchema;
