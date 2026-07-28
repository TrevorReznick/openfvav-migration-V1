import { readFileSync } from 'fs';
import { glob } from 'glob';
import { join } from 'path';
import { z } from 'zod';
import chalk from 'chalk';

// Schema per token estratti (per validazione interna)
const ExtractedTokensSchema = z.object({
  colors: z.record(z.string()),
  spacing: z.record(z.string()),
  typography: z.record(z.string()),
  custom: z.record(z.string()).optional()
}).strict();

/**
 * Estrae TUTTE le variabili CSS e le classifica in modo intelligente
 * @param {string} sourcePath - Percorso root del progetto sorgente
 */
export async function extractTokensFromCss(sourcePath) {
  console.log(chalk.blue(`🔍 Scanning CSS files in ${sourcePath}...`));

  // Trova tutti i file CSS/SCSS
  const cssFiles = await glob('**/*.{css,scss}', {
    cwd: sourcePath,
    absolute: true,
    ignore: ['**/node_modules/**']
  });

  if (cssFiles.length === 0) {
    console.warn(chalk.yellow('⚠️ Nessun file CSS trovato nella sorgente'));
    return { colors: {}, spacing: {}, typography: {}, custom: {} };
  }

  console.log(chalk.gray(`   Trovati ${cssFiles.length} file CSS`));

  // Leggi tutto il contenuto
  let allContent = '';
  for (const file of cssFiles) {
    try {
      allContent += `\n/* Source: ${file} */\n${readFileSync(file, 'utf-8')}\n`;
    } catch (error) {
      console.warn(chalk.yellow(`⚠️ Impossibile leggere il file ${file}: ${error.message}`));
    }
  }

  // Estrai tutte le variabili CSS
  const allVariables = {};
  const variableRegex = /--([\w-]+):\s*([^;]+);/g;
  let match;

  while ((match = variableRegex.exec(allContent)) !== null) {
    const [, name, value] = match;
    allVariables[name] = value.trim();
  }

  // Classifica le variabili
  const tokens = {
    colors: {},
    spacing: {},
    typography: {},
    custom: {}
  };

  for (const [name, val] of Object.entries(allVariables)) {
    // Colori: contiene parole chiave di colore o formati di colore - regex più permissiva
    if (name.match(/(background|foreground|primary|secondary|accent|destructive|muted|card|popover|border|input|ring)/i) ||
        name.match(/(color|fill|stroke|shadow|tint|shade|hue|saturation|lightness|alpha|opacity)/i) ||
        val.match(/^(#|rgb|hsl|hwb|lab|lch|oklab|oklch|color\(|var\(--color-)/i)) {
      const cleanName = normalizeColorName(name);
      tokens.colors[cleanName] = val;
    }
    // Spacing: contiene unità di misura
    else if (val.match(/\d+(?:\.\d+)?(px|rem|em|ex|ch|vh|vw|vmin|vmax|%|cm|mm|in|pt|pc)/)) {
      const cleanName = normalizeSpacingName(name);
      tokens.spacing[cleanName] = val;
    }
    // Typography: contiene proprietà tipografiche
    else if (name.match(/font|text|line-height|letter-spacing|word-spacing|text-(align|transform|decoration)/i) ||
             val.match(/(sans|serif|mono|system-ui)/i)) {
      const cleanName = normalizeTypographyName(name);
      // Remove quotes from typography values to prevent double quotes
      const cleanValue = val.replace(/['"]/g, '').trim();
      tokens.typography[cleanName] = cleanValue;
    }
    // Radius: cattura il radius come variabile custom importante
    else if (name.includes('radius')) {
      tokens.custom['radius'] = val; // Cattura il radius
    }
    // Altro: variabili custom
    else {
      tokens.custom[name] = val;
    }
  }

  // Validazione finale
  const result = ExtractedTokensSchema.safeParse(tokens);
  if (!result.success) {
    console.error(chalk.red('❌ Errore nella validazione dei token estratti:'), result.error);
    throw new Error('Formato token non valido');
  }

  console.log(chalk.green(
    `✅ Estratti: ${Object.keys(tokens.colors).length} colori, ` +
    `${Object.keys(tokens.spacing).length} spacing tokens, ` +
    `${Object.keys(tokens.typography).length} tipografie, ` +
    `${Object.keys(tokens.custom).length} variabili custom`
  ));

  return tokens;
}

// Funzioni di normalizzazione
function normalizeColorName(name) {
  return name
    .replace(/^--/, '')
    .replace(/^color-/, '')
    .replace(/-color$/, '')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .toLowerCase();
}

function normalizeSpacingName(name) {
  return name
    .replace(/^--/, '')
    .replace(/^(spacing|space|gap|margin|padding|inset)-?/i, '')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .toLowerCase();
}

function normalizeTypographyName(name) {
  return name
    .replace(/^--/, '')
    .replace(/^(font|text|typography)-?/i, '')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .toLowerCase();
}
