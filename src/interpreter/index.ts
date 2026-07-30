import type { RepositoryModel } from '../shared/types/repository.js';
import type { KnowledgeModel } from '../shared/types/knowledge.js';

/**
 * Interprets a RepositoryModel into a semantic KnowledgeModel.
 * This is the ONLY stage where AI/ML may be used.
 *
 * @param repositoryModel - The observed repository model.
 * @param options - Optional configuration (AI provider, model, etc.).
 * @returns A KnowledgeModel with domains, intents, entities, and patterns.
 */
export async function interpret(
  repositoryModel: RepositoryModel,
  options?: { provider?: string; model?: string; dryRun?: boolean }
): Promise<KnowledgeModel> {
  throw new Error('Not implemented: interpret');
}
