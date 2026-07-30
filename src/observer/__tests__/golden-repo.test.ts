import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { observeManifest } from '../index.js';
import type { RepositoryManifest } from '../../shared/types/manifest.js';
import { computeChecksum } from '../../shared/canonical-json.js';

// ============================================================================
// Golden Repo Regression Tests — observe must match expected.manifest.json
// ============================================================================

interface GoldenRepo {
  name: string;
  path: string;
}

const GOLDEN_REPOS: GoldenRepo[] = [
  { name: 'tiny-app', path: 'fixtures/tiny-app' },
  { name: 'openfav-reference', path: 'fixtures/openfav-reference' },
  { name: 'opennexus-reference', path: 'fixtures/opennexus-reference' },
];

/**
 * Load the committed expected manifest from a golden repo.
 */
function loadExpectedManifest(repoPath: string): RepositoryManifest {
  const manifestPath = resolve(repoPath, 'expected.manifest.json');
  const raw = readFileSync(manifestPath, 'utf-8');
  return JSON.parse(raw) as RepositoryManifest;
}

// Helper to create a stable version of the repository model for checksum comparison
function stableMetaForChecksum(meta: { analyzedAt: string; scanDurationMs: number; [k: string]: unknown }) {
  return { ...meta, analyzedAt: '', scanDurationMs: 0 };
}

describe('Golden Repo Regression (Epic 1 — Sprint 2)', () => {
  for (const repo of GOLDEN_REPOS) {
    it(`produces matching repositoryModel checksum for ${repo.name}`, async () => {
      const repoPath = resolve(repo.path);
      const expectedManifest = loadExpectedManifest(repo.path);
      const observedManifest = await observeManifest(repoPath);

      // Compare repositoryModel checksums (these are stable because timestamps/durations are zeroed out)
      expect(observedManifest.checksums.repositoryModel).toBe(
        expectedManifest.checksums.repositoryModel,
      );
    });

    it(`produces matching structural counts for ${repo.name}`, async () => {
      const repoPath = resolve(repo.path);
      const expectedManifest = loadExpectedManifest(repo.path);
      const observedManifest = await observeManifest(repoPath);

      const obs = observedManifest.repositoryModel;
      const exp = expectedManifest.repositoryModel;

      // Structural assertions
      expect(obs.metadata.framework).toBe(exp.metadata.framework);
      expect(obs.metadata.stylingApproach).toBe(exp.metadata.stylingApproach);
      expect(obs.metadata.language).toBe(exp.metadata.language);
      expect(obs.pages.length).toBe(exp.pages.length);
      expect(obs.components.length).toBe(exp.components.length);
      expect(obs.routes.length).toBe(exp.routes.length);
      expect(obs.imports.length).toBe(exp.imports.length);
      expect(obs.styles.length).toBe(exp.styles.length);
      expect(obs.tokens.length).toBe(exp.tokens.length);
    });

    it(`observed IDs are stable for ${repo.name}`, async () => {
      const repoPath = resolve(repo.path);
      const expectedManifest = loadExpectedManifest(repo.path);
      const observedManifest = await observeManifest(repoPath);

      // Page IDs must match
      const obsPageIds = observedManifest.repositoryModel.pages.map((p) => p.id).sort();
      const expPageIds = expectedManifest.repositoryModel.pages.map((p) => p.id).sort();
      expect(obsPageIds).toEqual(expPageIds);

      // Component IDs must match
      const obsCompIds = observedManifest.repositoryModel.components.map((c) => c.id).sort();
      const expCompIds = expectedManifest.repositoryModel.components.map((c) => c.id).sort();
      expect(obsCompIds).toEqual(expCompIds);

      // Route IDs must match
      const obsRouteIds = observedManifest.repositoryModel.routes.map((r) => r.id).sort();
      const expRouteIds = expectedManifest.repositoryModel.routes.map((r) => r.id).sort();
      expect(obsRouteIds).toEqual(expRouteIds);
    });
  }
});
