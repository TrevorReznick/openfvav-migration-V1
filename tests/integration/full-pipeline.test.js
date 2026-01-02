import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import { TokenEngine } from '../../src/core/token-engine.js';
import { Logger } from '../../src/utils/logger.js';
import { loadConfig } from '../../src/core/config-loader.js';

const TEST_V4 = './tests/fixtures/v4-real';
const TEST_V6 = './tests/fixtures/v6-real';

describe('TokenEngine - Full Real Pipeline', () => {
  beforeEach(() => {
    // 1. Create V4 with real CSS
    mkdirSync(`${TEST_V4}/src`, { recursive: true });
    writeFileSync(
      `${TEST_V4}/src/tokens.css`,
      `:root {
        --color-primary: #3B82F6;
        --color-background: #0F172A;
        --color-card: #1E293B;
        --spacing-1: 0.25rem;
        --spacing-4: 1rem;
        --font-sans: 'Inter', system-ui, sans-serif;
      }`
    );

    // 2. Create V6 with real template
    mkdirSync(`${TEST_V6}/src/lib`, { recursive: true });
    mkdirSync(`${TEST_V6}/src/styles`, { recursive: true });
    
    writeFileSync(
      `${TEST_V6}/src/lib/tokens.ts`,
      `export const tokens = {
  colors: {
    // @inject:--primary
    primary: 'PLACEHOLDER',
    // @inject:--background
    background: 'PLACEHOLDER',
    // @inject:--card
    card: 'PLACEHOLDER',
  },
  spacing: {
    // @inject:--1
    1: 'PLACEHOLDER',
    // @inject:--4
    4: 'PLACEHOLDER',
  },
  typography: {
    // @inject:--sans
    sans: 'PLACEHOLDER',
  }
} as const;`
    );
    
    writeFileSync(
      `${TEST_V6}/src/styles/globals.css`,
      `:root {
  /* @inject:--primary */
  --primary: PLACEHOLDER;
  /* @inject:--background */
  --background: PLACEHOLDER;
  /* @inject:--spacing-1 */
  --spacing-1: PLACEHOLDER;
}`
    );

    // 3. Create config
    writeFileSync('migration.config.json', JSON.stringify({
      version: "2.0",
      paths: { v4: TEST_V4, v6: TEST_V6 },
      options: { dryRun: false, outputFormat: 'ts' }
    }));
  });

  afterEach(() => {
    // Clean up test directories
    rmSync(TEST_V4, { recursive: true, force: true });
    rmSync(TEST_V6, { recursive: true, force: true });
    rmSync('migration.config.json', { force: true });
  });

  it('should execute REAL pipeline: extract → hydrate → verify', async () => {
    // NO MOCKS! Using real implementation
    const config = loadConfig();
    const logger = new Logger();
    const engine = new TokenEngine(config, logger);

    // Execute complete pipeline
    const result = await engine.run('v4', 'v6');

    // Verify result - 3 colors × 2 file = 6
    // 2 spacing × 2 file = 4
    // 1 typography × 2 file = 2
    // Totale: 12 tentativi
    // Ma 3 tag mancano in globals.css (card, spacing-4, font-sans)
    // Quindi: 12 - 3 = 9 SUCCESSI
    expect(result.changes).toBe(9);
    expect(result.warnings).toHaveLength(3); // Verifica i 3 warnings

    // Verify files were actually modified
    const tokensContent = readFileSync(`${TEST_V6}/src/lib/tokens.ts`, 'utf-8');
    expect(tokensContent).toContain("primary: '217 91% 60%'"); // #3B82F6 → HSL
    expect(tokensContent).toContain("background: '222 47% 11%'"); // #0F172A → HSL
    expect(tokensContent).toContain("1: '0.25rem'"); // Spacing
    expect(tokensContent).toContain("sans: 'Inter, system-ui, sans-serif'"); // Font

    const globalsContent = readFileSync(`${TEST_V6}/src/styles/globals.css`, 'utf-8');
    expect(globalsContent).toContain('--primary: 217 91% 60%;');
    expect(globalsContent).toContain('--background: 222 47% 11%;');
    expect(globalsContent).toContain('--spacing-1: 0.25rem;');
  });

  it('should work in dry-run mode without modifying files', async () => {
    // Create a fresh copy of the files for dry-run test
    const dryRunV6 = `${TEST_V6}-dryrun`;
    rmSync(dryRunV6, { recursive: true, force: true });
    mkdirSync(`${dryRunV6}/src/lib`, { recursive: true });
    mkdirSync(`${dryRunV6}/src/styles`, { recursive: true });
    
    // Copy the template files
    writeFileSync(
      `${dryRunV6}/src/lib/tokens.ts`,
      readFileSync(`${TEST_V6}/src/lib/tokens.ts`, 'utf-8')
    );
    writeFileSync(
      `${dryRunV6}/src/styles/globals.css`,
      readFileSync(`${TEST_V6}/src/styles/globals.css`, 'utf-8')
    );
    
    const config = loadConfig();
    config.paths.v6 = dryRunV6; // Use the dry-run specific directory
    config.options.dryRun = true;
    
    const logger = new Logger();
    const engine = new TokenEngine(config, logger);
    
    const beforeContent = readFileSync(`${dryRunV6}/src/lib/tokens.ts`, 'utf-8');
    
    const result = await engine.run('v4', 'v6');
    
    const afterContent = readFileSync(`${dryRunV6}/src/lib/tokens.ts`, 'utf-8');
    
    expect(result.changes).toBe(9);
    expect(afterContent).toBe(beforeContent); // Files should NOT be modified in dry-run mode
    
    // Clean up
    rmSync(dryRunV6, { recursive: true, force: true });
  });
});
