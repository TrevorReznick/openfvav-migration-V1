import { describe, it, expect, vi } from 'vitest';
import { TokenEngine } from '../../src/core/token-engine.js';
import { Logger } from '../../src/utils/logger.js';
import { mkdirSync, writeFileSync, rmSync } from 'fs';

describe('CLI Integration', () => {
  it('should create engine and run pipeline with test config', async () => {
    // Create test directories
    const testV4 = './tests/fixtures/v4-cli-test';
    const testV6 = './tests/fixtures/v6-cli-test';

    mkdirSync(`${testV4}/src`, { recursive: true });
    mkdirSync(`${testV6}/src/lib`, { recursive: true });
    mkdirSync(`${testV6}/src/styles`, { recursive: true });

    // Create test CSS file
    writeFileSync(
      `${testV4}/src/tokens.css`,
      `:root {
        --color-primary: #3B82F6;
        --spacing-1: 0.25rem;
      }`
    );

    // Create template files
    writeFileSync(
      `${testV6}/src/lib/tokens.ts`,
      `export const tokens = {
  colors: {
    // @inject:--primary
    primary: 'PLACEHOLDER',
  },
  spacing: {
    // @inject:--1
    1: 'PLACEHOLDER',
  }
} as const;`
    );

    writeFileSync(
      `${testV6}/src/styles/globals.css`,
      `:root {
  /* @inject:--primary */
  --primary: PLACEHOLDER;
  /* @inject:--spacing-1 */
  --spacing-1: PLACEHOLDER;
}`
    );

    // Create a minimal config for testing
    const testConfig = {
      version: "2.0",
      paths: {
        v4: testV4,
        v6: testV6
      },
      options: {
        dryRun: false,
        outputFormat: 'ts'
      }
    };

    const logger = new Logger();
    const engine = new TokenEngine(testConfig, logger);
    const result = await engine.run('v4', 'v6');
    expect(result.changes).toBeGreaterThan(0);

    // Clean up
    rmSync(testV4, { recursive: true, force: true });
    rmSync(testV6, { recursive: true, force: true });
  });
});
