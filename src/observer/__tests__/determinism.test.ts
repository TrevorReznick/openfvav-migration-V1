import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { observeManifest } from '../index.js';
import { validateChecksums } from '../../shared/manifest-io.js';

// ============================================================================
// Determinism Tests — same source → identical checksums every run
// ============================================================================

/**
 * Each golden repo path (relative to project root).
 */
const GOLDEN_REPOS = [
  'fixtures/tiny-app',
  'fixtures/openfav-reference',
  'fixtures/opennexus-reference',
];

const RUNS = 5;

describe('Repository Determinism (Epic 1 — Sprint 2)', () => {
  for (const repo of GOLDEN_REPOS) {
    it(`produces identical repositoryModel checksum across ${RUNS} runs for ${repo}`, async () => {
      const repoPath = resolve(repo);

      const hashes: string[] = [];

      for (let i = 0; i < RUNS; i++) {
        const manifest = await observeManifest(repoPath);

        // Verify checksums are self-consistent
        const validation = validateChecksums(manifest);
        expect(validation.valid).toBe(true);

        hashes.push(manifest.checksums.repositoryModel);
      }

      // All 5 hashes must be identical
      const first = hashes[0];
      for (let i = 1; i < hashes.length; i++) {
        expect(hashes[i]).toBe(first);
      }
    });
  }

  it('different repos produce different checksums', async () => {
    const [h1, h2, h3] = await Promise.all(
      GOLDEN_REPOS.map(async (repo) => {
        const manifest = await observeManifest(resolve(repo));
        return manifest.checksums.repositoryModel;
      }),
    );

    expect(h1).not.toBe(h2);
    expect(h1).not.toBe(h3);
    expect(h2).not.toBe(h3);
  });
});
