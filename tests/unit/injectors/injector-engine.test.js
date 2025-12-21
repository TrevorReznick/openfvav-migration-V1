// tests/unit/injectors/injector-engine.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, existsSync, rmSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { injectValue } from '../../../src/injectors/injector-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Injector Engine', () => {
  const testFile = resolve(__dirname, 'test-file.css');
  const initialContent = `:root {
  /* @inject:primary-color */
  --color-primary: #000000;

  /* @inject:secondary-color */
  --color-secondary: #ffffff;
}`;

  // Crea la directory dei test se non esiste
  const testDir = resolve(__dirname);
  if (!existsSync(testDir)) {
    require('fs').mkdirSync(testDir, { recursive: true });
  }

  beforeEach(() => {
    writeFileSync(testFile, initialContent, 'utf-8');
  });

  afterEach(() => {
    if (existsSync(testFile)) {
      rmSync(testFile);
    }
  });

  it('should inject value for existing key', () => {
    // First verify the file is created correctly
    expect(existsSync(testFile)).toBe(true);
    const contentBefore = readFileSync(testFile, 'utf-8');
    expect(contentBefore).toContain('@inject:primary-color');

    // Test the injection
    const result = injectValue(testFile, 'primary-color', '#ff0000');
    expect(result).toBe(true);

    // Verify the content
    const contentAfter = readFileSync(testFile, 'utf-8');
    expect(contentAfter).toContain('--color-primary: #ff0000');
    expect(contentAfter).toContain('--color-secondary: #ffffff'); // Should remain unchanged
  });

  it('should handle dry run without writing', () => {
    const result = injectValue(testFile, 'primary-color', '#00ff00', true);
    expect(result).toBe(true);

    // Verify the content wasn't changed
    const content = readFileSync(testFile, 'utf-8');
    expect(content).toBe(initialContent);
  });

  it('should return false for non-existent key', () => {
    const result = injectValue(testFile, 'non-existent-key', 'value');
    expect(result).toBe(false);
  });
});
