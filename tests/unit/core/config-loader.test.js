// tests/unit/core/config-loader.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { resolve } from 'path';
import { loadConfig } from '../../../src/core/config-loader.js';

describe('Config Loader', () => {
  const testDirs = ['test-v4', 'test-v6'];
  const testConfig = {
    version: "2.0",
    paths: {
      v4: './test-v4',
      v6: './test-v6'
    },
    options: {
      dryRun: false,
      outputFormat: 'ts'
    }
  };

  beforeEach(() => {
    // Create test directories
    testDirs.forEach(dir => {
      const path = resolve(process.cwd(), dir);
      if (!existsSync(path)) {
        mkdirSync(path, { recursive: true });
      }
    });
    
    // Create test config
    writeFileSync('migration.config.json', JSON.stringify(testConfig, null, 2));
  });

  afterEach(() => {
    // Cleanup test files
    if (existsSync('migration.config.json')) {
      rmSync('migration.config.json');
    }
    
    // Remove test directories
    testDirs.forEach(dir => {
      const path = resolve(process.cwd(), dir);
      if (existsSync(path)) {
        rmSync(path, { recursive: true, force: true });
      }
    });
  });

  it('should load and validate a valid config', () => {
    const config = loadConfig();
    expect(config).toBeDefined();
    expect(config.version).toBe('2.0'); // Match the version in testConfig
    expect(config.paths.v4).toContain('test-v4');
    expect(config.paths.v6).toContain('test-v6');
  });

  it('should throw an error for missing config file', () => {
    rmSync('migration.config.json');
    expect(() => loadConfig()).toThrow('Configurazione non trovata');
  });
});
