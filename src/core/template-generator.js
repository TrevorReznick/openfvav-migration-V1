import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export function createTokenTemplates(destPath) {
  const tsPath = join(destPath, 'src/lib/tokens.ts');
  const cssPath = join(destPath, 'src/styles/globals.css');

  // Valori di default per evitare il crash del design (0.25rem = 4px)
  const spacingDefaults = {
    "0": "0px", "1": "0.25rem", "2": "0.5rem", "4": "1rem", "8": "2rem", "12": "3rem"
  };

  const tsSpacing = Object.entries(spacingDefaults)
    .map(([k, v]) => `    // @inject:${k}\n    '${k}': '${v}',`)
    .join('\n');

  const cssSpacing = Object.entries(spacingDefaults)
    .map(([k, v]) => `    /* @inject:spacing-${k} */\n    --spacing-${k}: ${v};`)
    .join('\n');

  const tsContent = `export const tokens = {
  colors: {
    // @inject:primary
    'primary': '262 83% 58%',
    // @inject:background
    'background': '222 47% 11%',
    // @inject:foreground
    'foreground': '0 0% 100%',
    // @inject:card
    'card': '217 33% 17% / 0.3',
    // ... aggiungi altri se necessario
  },
  spacing: {
${tsSpacing}
  },
  typography: {
    // @inject:sans
    'sans': 'Inter, system-ui, sans-serif',
    // @inject:mono
    'mono': 'Roboto Mono, monospace',
  }
} as const;
export const getColor = (key) => \`hsl(var(--\${key}))\`;
export const getSpacing = (key) => \`var(--spacing-\${key})\`;
export default tokens;`;

  const cssContent = `@tailwind base;
@tailwind components;
@tailwind utilities;
@layer base {
  :root {
    /* @inject:primary */
    --primary: 262 83% 58%;
    /* @inject:background */
    --background: 222 47% 11%;
    /* @inject:foreground */
    --foreground: 0 0% 100%;
${cssSpacing}
    /* @inject:font-sans */
    --font-sans: 'Inter', system-ui, sans-serif;
    /* @inject:font-mono */
    --font-mono: 'Roboto Mono', monospace;
  }
  body { @apply bg-background text-foreground font-sans; }
}`;

  mkdirSync(join(destPath, 'src/lib'), { recursive: true });
  mkdirSync(join(destPath, 'src/styles'), { recursive: true });
  writeFileSync(tsPath, tsContent);
  writeFileSync(cssPath, cssContent);
}