import { readFileSync } from 'fs';
import { glob } from 'glob';
import type { StyleNode, TokenNode, RawToken } from '../shared/types/repository.js';

// ============================================================================
// CSS Observer — Migrated from src/modules/extractors/css-extractor.js
//
// Key changes from the original:
//  - TypeScript with full type annotations
//  - Input/Output: accepts a file path (or glob), returns { styles, tokens }
//    with properly typed StyleNode[] and TokenNode[] instead of the ad-hoc
//    { colors, spacing, typography, custom } shape.
//  - Token classification maps to the new TokenNode.category enum:
//      Colors → 'color'
//      Spacing/sizes → 'spacing'
//      Typography/fonts → 'typography'
//      Border-radius → 'radius'
//      Shadows → 'shadow'
//      Everything else → 'custom'
//  - Each TokenNode / StyleNode gets a unique id.
//  - Preserved: the core regex-based extraction, file reading, and
//    classification logic from the original.
// ============================================================================

// ---- Helper: normalisation functions (preserved from original) ----

function normalizeColorName(name: string): string {
  return name
    .replace(/^--/, '')
    .replace(/^color-/, '')
    .replace(/-color$/, '')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .toLowerCase();
}

function normalizeSpacingName(name: string): string {
  return name
    .replace(/^--/, '')
    .replace(/^(spacing|space|gap|margin|padding|inset)-?/i, '')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .toLowerCase();
}

function normalizeTypographyName(name: string): string {
  return name
    .replace(/^--/, '')
    .replace(/^(font|text|typography)-?/i, '')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .toLowerCase();
}

// ---- Helper: generate unique IDs ----

let _tokenSeq = 0;
let _styleSeq = 0;

function nextTokenId(): string {
  _tokenSeq += 1;
  return `token-${_tokenSeq}`;
}

function nextStyleId(): string {
  _styleSeq += 1;
  return `style-${_styleSeq}`;
}

/** Reset internal ID counters (useful for testing). */
export function resetIdCounters(): void {
  _tokenSeq = 0;
  _styleSeq = 0;
}

// ---- Main export ----

/**
 * Observes CSS/SCSS files in a directory and extracts design tokens.
 *
 * This is a TypeScript migration of the original `extractTokensFromCss`
 * function from `src/modules/extractors/css-extractor.js`. The core
 * regex-based extraction and classification logic is preserved; only
 * the input/output shapes have been adapted to the new type system.
 *
 * @param sourcePath - Root path to scan for CSS/SCSS files.
 * @returns An object containing StyleNode[] and TokenNode[] arrays.
 */
export async function observeCSS(
  sourcePath: string
): Promise<{ styles: StyleNode[]; tokens: TokenNode[] }> {
  // Reset ID counters for determinism across repeated observations
  resetIdCounters();

  // Locate all CSS/SCSS files (preserved glob pattern from original)
  const cssFiles = (await glob('**/*.{css,scss}', {
    cwd: sourcePath,
    absolute: true,
    ignore: ['**/node_modules/**'],
  })).sort();

  const styles: StyleNode[] = [];
  const tokens: TokenNode[] = [];

  if (cssFiles.length === 0) {
    return { styles, tokens };
  }

  for (const file of cssFiles) {
    let content: string;
    try {
      content = readFileSync(file, 'utf-8');
    } catch {
      // Skip unreadable files (preserved behaviour from original)
      continue;
    }

    // --- Extract CSS custom properties ---
    const rawTokens: RawToken[] = [];
    const variableRegex = /--([\w-]+):\s*([^;]+);/g;
    let match: RegExpExecArray | null;
    // Track line numbers for the regex matches
    const lineStarts: number[] = [0];
    for (let i = 0; i < content.length; i++) {
      if (content[i] === '\n') {
        lineStarts.push(i + 1);
      }
    }
    while ((match = variableRegex.exec(content)) !== null) {
      const [, name, value] = match;
      const offset = match.index;
      let line = 1;
      for (let l = lineStarts.length - 1; l >= 0; l--) {
        if (offset >= lineStarts[l]) {
          line = l + 1;
          break;
        }
      }
      rawTokens.push({ name: `--${name}`, value: value.trim(), line });
    }

    const variables: string[] = rawTokens.map((rt) => rt.name);

    // --- Classify tokens using the preserved classification logic ---
    const fileTokens: TokenNode[] = [];

    for (const rt of rawTokens) {
      const name = rt.name;
      const val = rt.value;

      // Determine category based on original regex rules
      let category: TokenNode['category'];

      // Colors
      if (
        name.match(
          /(background|foreground|primary|secondary|accent|destructive|muted|card|popover|border|input|ring)/i
        ) ||
        name.match(
          /(color|fill|stroke|shadow|tint|shade|hue|saturation|lightness|alpha|opacity)/i
        ) ||
        val.match(/^(#|rgb|hsl|hwb|lab|lch|oklab|oklch|color\(|var\(--color-)/i)
      ) {
        category = 'color';
      }
      // Spacing
      else if (val.match(/\d+(?:\.\d+)?(px|rem|em|ex|ch|vh|vw|vmin|vmax|%|cm|mm|in|pt|pc)/)) {
        category = 'spacing';
      }
      // Typography
      else if (
        name.match(/font|text|line-height|letter-spacing|word-spacing|text-(align|transform|decoration)/i) ||
        val.match(/(sans|serif|mono|system-ui)/i)
      ) {
        category = 'typography';
      }
      // Radius
      else if (name.includes('radius')) {
        category = 'radius';
      }
      // Shadow
      else if (name.includes('shadow')) {
        category = 'shadow';
      }
      // Everything else
      else {
        category = 'custom';
      }

      // Compute normalized name based on category
      let normalizedName: string;
      let normalizedValue: string;
      switch (category) {
        case 'color':
          normalizedName = normalizeColorName(name);
          normalizedValue = val; // preserved as-is; normalisation will happen later
          break;
        case 'spacing':
          normalizedName = normalizeSpacingName(name);
          normalizedValue = val;
          break;
        case 'typography':
          normalizedName = normalizeTypographyName(name);
          normalizedValue = val.replace(/['"]/g, '').trim();
          break;
        default:
          normalizedName = name.replace(/^--/, '').replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
          normalizedValue = val;
      }

      fileTokens.push({
        id: nextTokenId(),
        name: rt.name,
        value: rt.value,
        category,
        sourceFile: file,
        sourceLine: rt.line,
        normalizedName,
        normalizedValue,
      });
    }

    tokens.push(...fileTokens);

    // --- Create a StyleNode for this file ---
    // Detect the style type from the file extension
    const styleType: StyleNode['type'] = file.endsWith('.scss') ? 'scss' : 'css';

    styles.push({
      id: nextStyleId(),
      filePath: file,
      type: styleType,
      associatedComponent: null,
      tokenCount: fileTokens.length,
      rawTokens,
      variables,
      classes: [],
      sourceFile: file,
    });
  }

  return { styles, tokens };
}

// ---- Re-export helpers for test compatibility ----
export { normalizeColorName, normalizeSpacingName, normalizeTypographyName };
