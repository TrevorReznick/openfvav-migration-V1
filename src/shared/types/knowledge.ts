// ============================================================================
// Knowledge Model — Semantic understanding of a repository.
// Aligned with: docs/08-nexus-roadmap.md § Epic 3 — KnowledgeModel Schema
// ============================================================================

/**
 * Top-level knowledge model produced by the Interpretation stage (Epic 3).
 * Contains semantic understanding of domains, intents, entities, and patterns.
 */
export interface KnowledgeModel {
  /** ISO 8601 timestamp of when this knowledge model was generated. */
  generatedAt: string;
  /** Version of the interpreter that produced this model (e.g. "nexus-interpreter/1.0.0"). */
  interpreterVersion: string;
  /** Overall confidence score for the entire model (0.0–1.0). */
  confidence: number;

  domains: Domain[];
  intents: Intent[];
  entities: Entity[];
  relationships: Relationship[];
  patterns: Pattern[];
  archetypes: ArchetypeMatch[];
}

/**
 * A business domain identified in the repository.
 */
export interface Domain {
  /** Unique identifier for this domain. */
  id: string;
  /** Human-readable domain name (e.g. "Authentication", "Dashboard"). */
  name: string;
  /** Confidence score for this domain classification (0.0–1.0). */
  confidence: number;
  /** References to RepositoryModel nodes that support this classification. */
  evidence: string[];
  /** Human-readable description of the domain. (extra — beyond spec) */
  description: string;
  /** PageNode IDs belonging to this domain. (extra — beyond spec) */
  pages: string[];
  /** Entity IDs that are primary to this domain. (extra — beyond spec) */
  primaryEntities: string[];
}

/**
 * A user intent served by one or more pages.
 */
export interface Intent {
  /** Unique identifier for this intent. */
  id: string;
  /** Human-readable intent name (e.g. "User Login", "View Analytics"). */
  name: string;
  /** The class of intent. */
  type: 'informational' | 'transactional' | 'navigational' | 'functional';
  /** PageNode IDs that serve this intent. */
  servedBy: string[];
  /** Confidence score for this intent classification (0.0–1.0). */
  confidence: number;
  /** Source of this classification. */
  source: 'ai' | 'rule' | 'manual';
  /** Domain ID this intent belongs to. (extra — beyond spec) */
  domain: string;
  /** RouteNode IDs that trigger this intent. (extra — beyond spec) */
  triggers: string[];
  /** Entity IDs involved in this intent. (extra — beyond spec) */
  entities: string[];
}

/**
 * A domain entity discovered in the repository (model, view, controller, etc.).
 */
export interface Entity {
  /** Unique identifier for this entity. */
  id: string;
  /** Entity name (e.g. "User", "Invoice", "Product"). */
  name: string;
  /** Classification of the entity. */
  type: 'model' | 'view' | 'controller' | 'config' | 'unknown';
  /** ComponentNode IDs that define or use this entity. */
  sourceComponents: string[];
  /** Attributes (fields) of this entity. */
  attributes: EntityAttribute[];
  /** PageNode ID where this entity was first observed. (extra — beyond spec) */
  sourcePage: string;
}

/**
 * A single attribute/field of an entity.
 */
export interface EntityAttribute {
  /** Attribute name. */
  name: string;
  /** Inferred TypeScript type. */
  type: string;
  /** Whether the attribute is required. */
  required: boolean;
  /** Optional human-readable description. */
  description?: string;
}

/**
 * A relationship between two entities.
 */
export interface Relationship {
  /** Unique identifier for this relationship. */
  id: string;
  /** Source entity ID. */
  from: string;
  /** Target entity ID. */
  to: string;
  /** Type of relationship. */
  type: 'has-many' | 'belongs-to' | 'has-one' | 'many-to-many' | 'uses' | 'extends';
  /** Field name on the 'from' entity that establishes this relationship. */
  via?: string;
  /** Confidence score (0.0–1.0). */
  confidence: number;
  /** References to ImportNode / ComponentNode that support this relationship. */
  evidence: string[];
}

/**
 * A design or architecture pattern recognized in the repository.
 */
export interface Pattern {
  /** Unique identifier for this pattern. */
  id: string;
  /** Human-readable pattern name (e.g. "CRUD", "Container/Presentational"). */
  name: string;
  /** Category of pattern. */
  type: 'architecture' | 'design' | 'routing' | 'data-flow';
  /** ComponentNode / PageNode IDs exhibiting this pattern. */
  locations: string[];
  /** Confidence score (0.0–1.0). */
  confidence: number;
  /** Human-readable description of the pattern. (extra — beyond spec) */
  description: string;
  /** PageNode IDs matching this pattern. (extra — kept as additional signal) */
  pages: string[];
  /** Archetype ID this pattern is associated with. (extra — beyond spec) */
  archetype: string;
}

/**
 * Result of matching the repository against a known archetype from the catalog.
 */
export interface ArchetypeMatch {
  /** ID of the matched archetype (e.g. "authentication", "dashboard"). */
  archetypeId: string;
  /** Human-readable name of the matched archetype. */
  archetypeName: string;
  /** PageNode IDs that matched this archetype. */
  matchedPages: string[];
  /** ComponentNode IDs that matched this archetype. */
  matchedComponents: string[];
  /** Confidence score (0.0–1.0). */
  confidence: number;
  /** Human-readable rationale explaining why this archetype was matched. */
  rationale: string;
  /** Human-readable evidence supporting the match. (extra — renamed from spec's `evidence` to avoid collision with Relationship.evidence) */
  matchEvidence: string[];
}
