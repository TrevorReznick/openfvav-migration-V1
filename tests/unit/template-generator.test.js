import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTokenTemplates } from '../../src/core/template-generator.js';
import { existsSync, readFileSync, rmSync } from 'fs';
import { mkdirSync } from 'fs';

describe('Template Generator', () => {
  const testDir = './test-fixtures-templates';

  beforeAll(() => {
    // Create test directory
    mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    // Clean up test directory
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should generate files with @inject tags', async () => {
    await createTokenTemplates(testDir);

    const tokensContent = readFileSync(`${testDir}/src/lib/tokens.ts`, 'utf-8');
    expect(tokensContent).toContain('// @inject:--primary');
    expect(tokensContent).toContain('// @inject:--1');
  });

  it('should create proper directory structure', async () => {
    await createTokenTemplates(testDir);

    expect(existsSync(`${testDir}/src/lib/tokens.ts`)).toBe(true);
    expect(existsSync(`${testDir}/src/styles/globals.css`)).toBe(true);
  });
});
