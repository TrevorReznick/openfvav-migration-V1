import { TokenEngine } from '../core/token-engine.js';
import { createTokenTemplates } from '../core/template-generator.js';
import { Logger } from '../utils/logger.js';
import chalk from 'chalk';

/**
 * MigrationEngine - Two-pass migration system
 * Fase 1: Template Generation → Fase 2: Extract & Hydrate
 */
export class MigrationEngine {
  constructor(config, logger = new Logger()) {
    this.config = config;
    this.logger = logger;
    this.tokenEngine = new TokenEngine(config, logger);
  }

  /**
   * Fase 1: Assicura che i template esistano nel progetto V6
   */
  async ensureTemplates(v6Path) {
    this.logger.info('🛠️  Ensuring V6 templates exist...');

    try {
      await createTokenTemplates(v6Path);
      this.logger.success('✅ V6 templates ready');
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to create templates: ${error.message}`);
      return false;
    }
  }

  /**
   * Fase 2: Esegue estrazione e idratazione
   */
  async migrateTokens(sourceVersion = 'v4', targetVersion = 'v6', options = {}) {
    this.logger.info(`🚀 Starting two-pass migration: ${sourceVersion} → ${targetVersion}`);

    // Estrai token
    const tokens = await this.tokenEngine.extract(sourceVersion);

    // Idrata token
    const result = await this.tokenEngine.hydrate(tokens, targetVersion, options);

    return result;
  }

  /**
   * Pipeline completa two-pass: template → extract → hydrate
   */
  async runFullMigration(sourceVersion = 'v4', targetVersion = 'v6', options = {}) {
    const v6Path = this.config.paths[targetVersion];

    this.logger.info('🎯 Starting full migration pipeline...');

    // Fase 1: Template generation
    const templatesReady = await this.ensureTemplates(v6Path);
    if (!templatesReady) {
      throw new Error('Failed to prepare V6 templates');
    }

    // Fase 2: Extract & Hydrate
    const result = await this.migrateTokens(sourceVersion, targetVersion, options);

    this.logger.success('🎉 Migration completed successfully!');
    return result;
  }
}
