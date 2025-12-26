import { extractTokensFromCss } from '../modules/extractors/css-extractor.js';
import { hydrateTokens } from '../modules/hydrators/token-hydrator.js';
import { Logger } from '../utils/logger.js';

/**
 * Orchestratore del flusso completo: estrazione → idratazione
 */
export class TokenEngine {
  constructor(config, logger = new Logger()) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Estrae i token dalla sorgente (V3/V4)
   */
  async extract(sourceVersion = 'v4') {
    const sourcePath = this.config.paths[sourceVersion];
    this.logger.info(`🔍 Extracting tokens from ${sourceVersion} at ${sourcePath}`);
    
    const tokens = await extractTokensFromCss(sourcePath);
    this.logger.success(`✅ Extracted ${Object.keys(tokens.colors).length} colors, ${Object.keys(tokens.spacing).length} spacing, ${Object.keys(tokens.typography).length} fonts`);
    
    return tokens;
  }

  /**
   * Idra i token nella destinazione (V6)
   */
  async hydrate(tokens, targetVersion = 'v6', options = {}) {
    const destPath = this.config.paths[targetVersion];
    this.logger.info(`💧 Hydrating tokens into ${targetVersion} at ${destPath}`);
    
    const result = await hydrateTokens(destPath, tokens, options);
    this.logger.success(`✅ Hydrated ${result.changes} values`);
    
    if (result.warnings.length > 0) {
      this.logger.warning(`⚠️  ${result.warnings.length} warnings (missing @inject tags in template)`);
    }
    
    return result;
  }

  /**
   * Esegue pipeline completa: extract → hydrate
   */
  async run(sourceVersion = 'v4', targetVersion = 'v6', options = {}) {
    this.logger.info(`🚀 Starting token pipeline: ${sourceVersion} → ${targetVersion}`);
    
    const tokens = await this.extract(sourceVersion);
    const result = await this.hydrate(tokens, targetVersion, this.config.options);
    
    this.logger.info('🎉 Token migration completed successfully');
    return result;
  }
}
