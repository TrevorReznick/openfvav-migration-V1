import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { extractTokensFromCss } from '../modules/extractors/css-extractor.js';

/**
 * Analizza i token estratti da V4 e aggiunge SOLO i tag @inject mancanti nei file V6
 * @param {object} tokens - Token estratti da V4 {colors, spacing, typography}
 * @param {string} destPath - Percorso del progetto V6
 */
export function seedTemplates(tokens, destPath) {
  const tokensFile = join(destPath, 'src/lib/tokens.ts');
  const globalsFile = join(destPath, 'src/styles/globals.css');

  let totalAdded = 0;

  // 1. Aggiungi tag COLORI mancanti in tokens.ts
  if (tokens.colors) {
    let tsContent = readFileSync(tokensFile, 'utf-8');
    let addedInTS = 0;

    for (const key of Object.keys(tokens.colors)) {
      if (!tsContent.includes(`// @inject:--${key}`)) {
        // Trova la sezione colors e aggiungi dopo l'ultimo tag esistente
        const colorsSection = tsContent.indexOf('  colors: {');
        if (colorsSection !== -1) {
          const nextClosingBrace = tsContent.indexOf('  },', colorsSection);
          if (nextClosingBrace !== -1) {
            // Trova l'ultimo @inject nella sezione colors
            const lastInjectInColors = tsContent.lastIndexOf('// @inject:', nextClosingBrace);
            if (lastInjectInColors !== -1) {
              const insertPos = tsContent.indexOf('\n', lastInjectInColors) + 1;
              const lineToAdd = `    // @inject:--${key}\n    ${key}: 'PLACEHOLDER',\n`;
              tsContent = tsContent.slice(0, insertPos) + lineToAdd + tsContent.slice(insertPos);
              addedInTS++;
            }
          }
        }
      }
    }

    if (addedInTS > 0) {
      writeFileSync(tokensFile, tsContent);
      console.log(chalk.green(`✅ Added ${addedInTS} color tags to tokens.ts`));
      totalAdded += addedInTS;
    }
  }

  // 2. Aggiungi tag COLORI mancanti in globals.css
  if (tokens.colors) {
    let cssContent = readFileSync(globalsFile, 'utf-8');
    let addedInCSS = 0;

    for (const key of Object.keys(tokens.colors)) {
      if (!cssContent.includes(`/* @inject:--${key} */`)) {
        // Trova la sezione :root e aggiungi dopo l'ultimo tag esistente
        const rootStart = cssContent.indexOf(':root {');
        if (rootStart !== -1) {
          const rootEnd = cssContent.indexOf('}', rootStart);
          if (rootEnd !== -1) {
            // Trova l'ultimo @inject nella sezione :root
            const lastInjectInRoot = cssContent.lastIndexOf('/* @inject:', rootEnd);
            if (lastInjectInRoot !== -1) {
              const insertPos = cssContent.indexOf('\n', lastInjectInRoot) + 1;
              const lineToAdd = `  /* @inject:--${key} */\n  --${key}: PLACEHOLDER;\n`;
              cssContent = cssContent.slice(0, insertPos) + lineToAdd + cssContent.slice(insertPos);
              addedInCSS++;
            }
          }
        }
      }
    }

    if (addedInCSS > 0) {
      writeFileSync(globalsFile, cssContent);
      console.log(chalk.green(`✅ Added ${addedInCSS} color tags to globals.css`));
      totalAdded += addedInCSS;
    }
  }

  // 3. Aggiungi tag SPACING mancanti in tokens.ts
  if (tokens.spacing) {
    let tsContent = readFileSync(tokensFile, 'utf-8');
    let addedSpacingInTS = 0;

    for (const key of Object.keys(tokens.spacing)) {
      if (!tsContent.includes(`// @inject:--${key}`)) {
        // Trova la sezione spacing e aggiungi
        const spacingSection = tsContent.indexOf('  spacing: {');
        if (spacingSection !== -1) {
          const nextClosingBrace = tsContent.indexOf('  },', spacingSection);
          if (nextClosingBrace !== -1) {
            const lastInjectInSpacing = tsContent.lastIndexOf('// @inject:', nextClosingBrace);
            if (lastInjectInSpacing !== -1) {
              const insertPos = tsContent.indexOf('\n', lastInjectInSpacing) + 1;
              const lineToAdd = `    // @inject:--${key}\n    ${key}: 'PLACEHOLDER',\n`;
              tsContent = tsContent.slice(0, insertPos) + lineToAdd + tsContent.slice(insertPos);
              addedSpacingInTS++;
            }
          }
        }
      }
    }

    if (addedSpacingInTS > 0) {
      writeFileSync(tokensFile, tsContent);
      console.log(chalk.green(`✅ Added ${addedSpacingInTS} spacing tags to tokens.ts`));
      totalAdded += addedSpacingInTS;
    }
  }

  // 4. Aggiungi tag SPACING mancanti in globals.css (--spacing-X)
  if (tokens.spacing) {
    let cssContent = readFileSync(globalsFile, 'utf-8');
    let addedSpacingInCSS = 0;

    for (const key of Object.keys(tokens.spacing)) {
      const cssKey = `spacing-${key}`;
      if (!cssContent.includes(`/* @inject:${cssKey} */`)) {
        const rootStart = cssContent.indexOf(':root {');
        if (rootStart !== -1) {
          const rootEnd = cssContent.indexOf('}', rootStart);
          if (rootEnd !== -1) {
            const lastInjectInRoot = cssContent.lastIndexOf('/* @inject:', rootEnd);
            if (lastInjectInRoot !== -1) {
              const insertPos = cssContent.indexOf('\n', lastInjectInRoot) + 1;
              const lineToAdd = `  /* @inject:--${cssKey} */\n  --${cssKey}: PLACEHOLDER;\n`;
              cssContent = cssContent.slice(0, insertPos) + lineToAdd + cssContent.slice(insertPos);
              addedSpacingInCSS++;
            }
          }
        }
      }
    }

    if (addedSpacingInCSS > 0) {
      writeFileSync(globalsFile, cssContent);
      console.log(chalk.green(`✅ Added ${addedSpacingInCSS} spacing tags to globals.css`));
      totalAdded += addedSpacingInCSS;
    }
  }

  // 5. Aggiungi tag TYPOGRAPHY mancanti
  if (tokens.typography) {
    let tsContent = readFileSync(tokensFile, 'utf-8');
    let cssContent = readFileSync(globalsFile, 'utf-8');
    let addedTypography = 0;

    for (const key of Object.keys(tokens.typography)) {
      // In tokens.ts
      if (!tsContent.includes(`// @inject:--${key}`)) {
        const typographySection = tsContent.indexOf('  typography: {');
        if (typographySection !== -1) {
          const nextClosingBrace = tsContent.indexOf('  }', typographySection);
          if (nextClosingBrace !== -1) {
            const lastInjectInTypography = tsContent.lastIndexOf('// @inject:', nextClosingBrace);
            if (lastInjectInTypography !== -1) {
              const insertPos = tsContent.indexOf('\n', lastInjectInTypography) + 1;
              const lineToAdd = `    // @inject:--${key}\n    ${key}: 'PLACEHOLDER',\n`;
              tsContent = tsContent.slice(0, insertPos) + lineToAdd + tsContent.slice(insertPos);
              addedTypography++;
            }
          }
        }
      }

      // In globals.css (--font-X)
      const cssKey = `font-${key}`;
      if (!cssContent.includes(`/* @inject:--${cssKey} */`)) {
        const rootStart = cssContent.indexOf(':root {');
        if (rootStart !== -1) {
          const rootEnd = cssContent.indexOf('}', rootStart);
          if (rootEnd !== -1) {
            const lastInjectInRoot = cssContent.lastIndexOf('/* @inject:', rootEnd);
            if (lastInjectInRoot !== -1) {
              const insertPos = cssContent.indexOf('\n', lastInjectInRoot) + 1;
              const lineToAdd = `  /* @inject:--${cssKey} */\n  --${cssKey}: PLACEHOLDER;\n`;
              cssContent = cssContent.slice(0, insertPos) + lineToAdd + cssContent.slice(insertPos);
            }
          }
        }
      }
    }

    if (addedTypography > 0) {
      writeFileSync(tokensFile, tsContent);
      writeFileSync(globalsFile, cssContent);
      console.log(chalk.green(`✅ Added ${addedTypography} typography tags`));
      totalAdded += addedTypography;
    }
  }

  if (totalAdded === 0) {
    console.log(chalk.blue('ℹ️  All @inject tags already present - no changes needed'));
  } else {
    console.log(chalk.green(`🎉 Seeded ${totalAdded} missing @inject tags total`));
  }

  return totalAdded;
}

/**
 * Comando CLI: analizza V4 e aggiunge tag mancanti in V6
 */
export async function runSeedTemplates(config) {
  console.log(chalk.cyan('\n🌱 OpenFav Template Seeder v2.0.3'));
  console.log(chalk.gray('Analyzing V4 tokens and seeding missing @inject tags...\n'));

  try {
    // Estrai token da V4
    const tokens = await extractTokensFromCss(config.paths.v4);
    console.log(chalk.gray(`📊 Found ${Object.keys(tokens.colors || {}).length} colors, ${Object.keys(tokens.spacing || {}).length} spacing, ${Object.keys(tokens.typography || {}).length} typography tokens`));

    // Seed i template
    const added = seedTemplates(tokens, config.paths.v6);

    if (added > 0) {
      console.log(chalk.green('\n✅ Template seeding completed!'));
      console.log(chalk.yellow('💡 Next: Run "npm run hydrate" to inject values'));
    } else {
      console.log(chalk.blue('\n✅ Templates are already complete!'));
      console.log(chalk.gray('   You can proceed directly to "npm run hydrate"'));
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Template seeding failed:'), error.message);
    process.exit(1);
  }
}
