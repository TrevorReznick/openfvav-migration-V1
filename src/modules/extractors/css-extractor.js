import { readFileSync } from 'fs';
import { glob } from 'glob';
import { join } from 'path';
import postcss from 'postcss';
import { z } from 'zod';
import chalk from 'chalk';

// Schema per token estratti (per validazione interna)
const ExtractedTokensSchema = z.object({
  colors: z.record(z.string()),
  spacing: z.record(z.string()),
  typography: z.record(z.string()),
}).strict();

// Import the PostCSS plugin
import extractTokensPluginModule from './postcss-extractor.mjs';

// Get the plugin function from the module
const extractTokensPlugin = extractTokensPluginModule.default || extractTokensPluginModule;

/**
 * Estrae tutti i token design da una codebase V3/V4
 * @param {string} sourcePath - Percorso root del progetto sorgente
 */
export async function extractTokensFromCss(sourcePath) {
  console.log(chalk.blue(`🔍 Scanning CSS files in ${sourcePath}...`));

  // Trova tutti i file CSS/SCSS
  const cssFiles = await glob('src/**/*.{css,scss}', {
    cwd: sourcePath,
    absolute: true
  });

  if (cssFiles.length === 0) {
    console.warn(chalk.yellow('⚠️ Nessun file CSS trovato nella sorgente'));
    return { colors: {}, spacing: {}, typography: {} };
  }

  console.log(chalk.gray(`   Trovati ${cssFiles.length} file CSS`));

  // Leggi tutto il contenuto
  const allContent = cssFiles
    .map(file => readFileSync(file, 'utf-8'))
    .join('\n\n');

  // Contenitori per token
  const colorTokens = {};
  const customVariables = {};
  const typographyTokens = {};

  // Esegui PostCSS extraction
  try {
    const processor = postcss();
    const plugin = extractTokensPlugin({
      colorTokens,
      customVariables,
      typographyTokens
    });
    
    await processor
      .use(plugin)
      .process(allContent, { from: undefined });
  } catch (error) {
    console.error(chalk.red('❌ Error processing CSS:'), error);
    throw error;
  }

  // Normalizza e valida l'output
  const normalized = normalizeExtractedTokens({
    colors: colorTokens,
    custom: customVariables,
    typography: typographyTokens
  });

  console.log(chalk.green(
    `✅ Estratti ${Object.keys(normalized.colors).length} colori, ` +
    `${Object.keys(normalized.spacing).length} spacing tokens, ` +
    `${Object.keys(normalized.typography).length} font`
  ));

  return normalized;
}

/**
 * Normalizza i nomi dei token estratti per adattarli allo schema V6
 */
function normalizeExtractedTokens(raw) {
  const colors = {};
  const spacing = {};
  const typography = {};

  // Normalizza colori: rimuovi prefissi --color- e suffissi -color
  for (const [key, val] of Object.entries(raw.colors || {})) {
    const cleanKey = key
      .replace(/^--color-/, '')
      .replace(/--color$/, '')
      .replace(/-color$/, '');
    colors[cleanKey] = val;
  }

  // Estrai spacing da variabili custom (--spacing-1, --space-2, ecc.)
  for (const [key, val] of Object.entries(raw.custom || {})) {
    const spacingMatch = key.match(/^--(?:spacing|space)-(\d+)$/);
    if (spacingMatch) {
      spacing[spacingMatch[1]] = val;
    }
  }

  // Normalizza typography: rimuovi prefisso font-
  for (const [key, val] of Object.entries(raw.typography || {})) {
    if (key.startsWith('--font-')) {
      typography[key.replace('--font-', '')] = val;
    }
  }

  return { colors, spacing, typography };
}
