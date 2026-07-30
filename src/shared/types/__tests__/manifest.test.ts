import { describe, it, expect } from 'vitest';
import { RepositoryManifestSchema } from '../manifest.js';

describe('RepositoryManifest', () => {
  const validChecksum = '0'.repeat(64);

  it('should accept a valid empty manifest', () => {
    const manifest = {
      schemaVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
      generatedBy: 'nexus-observer/1.0.0',
      sourcePath: '/test',
      metadata: {
        name: 'test-project',
        rootPath: '/test',
        framework: 'unknown',
        stylingApproach: 'mixed',
        language: 'mixed',
        fileCount: 0,
        totalPages: 0,
        totalComponents: 0,
        analyzedAt: new Date().toISOString(),
        version: '1.0.0',
        scanDurationMs: 0
      },
      repositoryModel: {
        metadata: {
          name: 'test-project',
          rootPath: '/test',
          framework: 'unknown',
          stylingApproach: 'mixed',
          language: 'mixed',
          fileCount: 0,
          totalPages: 0,
          totalComponents: 0,
          analyzedAt: new Date().toISOString(),
          version: '1.0.0',
          scanDurationMs: 0
        },
        pages: [],
        components: [],
        routes: [],
        imports: [],
        styles: [],
        tokens: [],
        apis: []
      },
      knowledgeModel: null,
      definitions: null,
      checksums: {
        repositoryModel: validChecksum,
        knowledgeModel: null,
        definitions: null
      }
    };

    const result = RepositoryManifestSchema.safeParse(manifest);
    expect(result.success).toBe(true);
  });

  it('should reject invalid schemaVersion', () => {
    const result = RepositoryManifestSchema.safeParse({ schemaVersion: 123 });
    expect(result.success).toBe(false);
  });

  it('should reject missing checksums', () => {
    const result = RepositoryManifestSchema.safeParse({
      schemaVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
      generatedBy: 'test',
      sourcePath: '/test',
      metadata: {},
      repositoryModel: {},
      knowledgeModel: null,
      definitions: null
    });
    expect(result.success).toBe(false);
  });

  it('should reject checksum with wrong length', () => {
    const result = RepositoryManifestSchema.safeParse({
      schemaVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
      generatedBy: 'test',
      sourcePath: '/test',
      metadata: {},
      repositoryModel: {},
      knowledgeModel: null,
      definitions: null,
      checksums: {
        repositoryModel: 'too-short',
        knowledgeModel: null,
        definitions: null
      }
    });
    expect(result.success).toBe(false);
  });
});
