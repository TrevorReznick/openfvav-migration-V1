import { join } from 'path';
import { injectValue } from '../../injectors/injector-engine.js';
import { toPureHsl } from '../../transformers/color-transformer.js';
import chalk from 'chalk';

/**
 * Idrata i template V6 con i token estratti.
 * @param {string} destPath - Percorso root del progetto V6
 * @param {object} tokens - Token estratti {colors, spacing, typography}
 * @param {object} options - { dryRun: boolean }
 * @returns {Promise<{changes: number, warnings: string[]}>}
 */
export async function hydrateTokens(destPath, tokens, options = {}) {
  const { dryRun = false } = options;
  
  const tokensFile = join(destPath, 'src/lib/tokens.ts');
  const globalsFile = join(destPath, 'src/styles/globals.css');
  
  if (!dryRun) {
    console.log(chalk.blue(`💧 Hydrating tokens into ${destPath}...`));
  } else {
    console.log(chalk.yellow(`🔍 DRY RUN - Simulating hydration into ${destPath}...`));
  }
  
  const warnings = [];
  let totalChanges = 0;

  // 1. Idrata i Colori
  for (const [key, value] of Object.entries(tokens.colors || {})) {
    const hslValue = toPureHsl(value);
    
    // Inietta in tokens.ts
    const tsSuccess = injectValue(tokensFile, key, hslValue, dryRun);
    if (tsSuccess) {
      totalChanges++;
    } else {
      warnings.push(`Tag @inject:${key} not found in ${tokensFile}`);
    }
    
    // Inietta in globals.css
    const cssSuccess = injectValue(globalsFile, key, hslValue, dryRun);
    if (cssSuccess) {
      totalChanges++;
    } else {
      warnings.push(`Tag @inject:${key} not found in ${globalsFile}`);
    }
  }

  // 2. Idrata lo Spacing
  for (const [key, value] of Object.entries(tokens.spacing || {})) {
    // In tokens.ts: spacing.1 = '0.25rem'
    const tsSuccess = injectValue(tokensFile, key, value, dryRun);
    if (tsSuccess) {
      totalChanges++;
    } else {
      warnings.push(`Tag @inject:${key} not found in ${tokensFile}`);
    }
    
    // In globals.css: --spacing-1: 0.25rem
    const cssKey = `spacing-${key}`;
    const cssSuccess = injectValue(globalsFile, cssKey, value, dryRun);
    if (cssSuccess) {
      totalChanges++;
    } else {
      warnings.push(`Tag @inject:${cssKey} not found in ${globalsFile}`);
    }
  }

  // 3. Idrata la Typography
  for (const [key, value] of Object.entries(tokens.typography || {})) {
    // In tokens.ts: typography.sans = '...'
    const tsSuccess = injectValue(tokensFile, key, value, dryRun);
    if (tsSuccess) {
      totalChanges++;
    } else {
      warnings.push(`Tag @inject:${key} not found in ${tokensFile}`);
    }
    
    // In globals.css: --font-sans: '...'
    const cssKey = `font-${key}`;
    const cssSuccess = injectValue(globalsFile, cssKey, value, dryRun);
    if (cssSuccess) {
      totalChanges++;
    } else {
      warnings.push(`Tag @inject:${cssKey} not found in ${globalsFile}`);
    }
  }

  if (!dryRun) {
    console.log(chalk.green(`✅ Hydrated ${totalChanges} values`));
    if (warnings.length > 0) {
      console.warn(chalk.yellow(`⚠️  ${warnings.length} warnings`));
    }
  } else {
    console.log(chalk.yellow(`🔍 Simulated ${totalChanges} changes`));
  }

  return { changes: totalChanges, warnings };
}
