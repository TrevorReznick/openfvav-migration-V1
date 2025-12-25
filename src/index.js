import { loadConfig } from './core/config-loader.js';
import { TokenEngine } from './core/token-engine.js';
import { Logger } from './utils/logger.js';

/**
 * Main function to run the token migration pipeline
 * @returns {Promise<Object>} Result of the migration
 */
async function run() {
  const logger = new Logger();
  
  try {
    logger.info('Starting token migration pipeline...');
    
    // Load configuration
    const config = loadConfig();
    
    // Initialize the token engine
    const engine = new TokenEngine(config, logger);
    
    // Run the migration
    const result = await engine.run('v4', 'v6');
    
    logger.info(`Migration completed successfully with ${result.changes} changes`);
    return result;
  } catch (error) {
    logger.error('Error in token migration pipeline:', error);
    throw error;
  }
}

export { run };

export { run };
