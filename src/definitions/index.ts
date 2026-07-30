import type { KnowledgeModel } from '../shared/types/knowledge.js';
import type { ApplicationDefinition } from '../shared/types/definitions.js';

/**
 * Transforms a KnowledgeModel into an ApplicationDefinition.
 * The Application is the strategic object — pages and widgets are derived from it.
 *
 * @param knowledgeModel - The interpreted knowledge model.
 * @returns A complete ApplicationDefinition.
 */
export async function define(knowledgeModel: KnowledgeModel): Promise<ApplicationDefinition> {
  throw new Error('Not implemented: define');
}
