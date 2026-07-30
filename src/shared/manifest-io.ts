import { writeFile, rename, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { RepositoryManifest } from './types/manifest.js';
import type { RepositoryModel, RepositoryMetadata } from './types/repository.js';
import { canonicalStringify, computeChecksum } from './canonical-json.js';

// ============================================================================
// Manifest I/O — create, write, and validate RepositoryManifests
// ============================================================================

/**
 * Strip volatile timestamp/duration fields from metadata to produce a
 * deterministic checksum payload. The actual timestamps remain in the
 * manifest for observability; they are only excluded from checksums.
 */
function stableMetaForChecksum(meta: RepositoryMetadata): RepositoryMetadata {
  return {
    ...meta,
    analyzedAt: '',
    scanDurationMs: 0,
  };
}

/**
 * Build a complete RepositoryManifest from observation results.
 *
 * Checksums are computed on "stable" versions of the models (timestamps
 * and durations zeroed out) so that repeated observations of the same
 * source produce identical checksums regardless of wall-clock time.
 *
 * @param sourcePath - Absolute or relative path to the source repository root.
 * @param metadata - RepositoryMetadata from framework-detector.
 * @param repositoryModel - Complete RepositoryModel from all observers.
 * @returns A fully populated RepositoryManifest with SHA-256 checksums.
 */
export function createManifest(
  sourcePath: string,
  metadata: RepositoryMetadata,
  repositoryModel: RepositoryModel,
): RepositoryManifest {
  const now = new Date().toISOString();

  // Build a stable version of the repository model for checksum computation
  const stableModel: RepositoryModel = {
    ...repositoryModel,
    metadata: stableMetaForChecksum(repositoryModel.metadata),
  };

  const manifest: RepositoryManifest = {
    schemaVersion: '1.0.0',
    generatedAt: now,
    generatedBy: 'nexus-observer/1.0.0',
    sourcePath,
    metadata,
    repositoryModel,
    knowledgeModel: null,
    definitions: null,
    checksums: {
      repositoryModel: computeChecksum(stableModel),
      knowledgeModel: null,
      definitions: null,
    },
  };

  return manifest;
}

/**
 * Atomically write a RepositoryManifest to disk using canonical JSON.
 *
 * Writes to a `.tmp` file first, then renames to the target path to avoid
 * partial writes. Creates parent directories if needed.
 *
 * @param manifest - The manifest to write.
 * @param outputPath - Destination file path.
 */
export async function writeManifest(
  manifest: RepositoryManifest,
  outputPath: string,
): Promise<void> {
  const json = canonicalStringify(manifest);

  // Ensure parent directory exists
  const dir = dirname(outputPath);
  await mkdir(dir, { recursive: true });

  // Atomic write: .tmp → rename
  const tmpPath = outputPath + '.tmp';
  await writeFile(tmpPath, json, 'utf-8');
  await rename(tmpPath, outputPath);
}

/**
 * Validate that a manifest's checksums match its content.
 *
 * Recomputes checksums for each section and compares against stored values.
 *
 * @param manifest - The manifest to validate.
 * @returns Object with `valid` flag and `errors` array describing mismatches.
 */
export function validateChecksums(manifest: RepositoryManifest): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate repositoryModel checksum — use stable model (no timestamps/durations)
  const stableModel: RepositoryModel = {
    ...manifest.repositoryModel,
    metadata: stableMetaForChecksum(manifest.repositoryModel.metadata),
  };
  const computedRepo = computeChecksum(stableModel);
  if (computedRepo !== manifest.checksums.repositoryModel) {
    errors.push(
      `repositoryModel checksum mismatch: stored=${manifest.checksums.repositoryModel} computed=${computedRepo}`,
    );
  }

  // Validate knowledgeModel checksum (if present)
  if (manifest.knowledgeModel !== null && manifest.checksums.knowledgeModel !== null) {
    const computedKnowledge = computeChecksum(manifest.knowledgeModel);
    if (computedKnowledge !== manifest.checksums.knowledgeModel) {
      errors.push(
        `knowledgeModel checksum mismatch: stored=${manifest.checksums.knowledgeModel} computed=${computedKnowledge}`,
      );
    }
  } else if (
    (manifest.knowledgeModel === null && manifest.checksums.knowledgeModel !== null) ||
    (manifest.knowledgeModel !== null && manifest.checksums.knowledgeModel === null)
  ) {
    errors.push('knowledgeModel null state mismatch between model and checksum');
  }

  // Validate definitions checksum (if present)
  if (manifest.definitions !== null && manifest.checksums.definitions !== null) {
    const computedDefs = computeChecksum(manifest.definitions);
    if (computedDefs !== manifest.checksums.definitions) {
      errors.push(
        `definitions checksum mismatch: stored=${manifest.checksums.definitions} computed=${computedDefs}`,
      );
    }
  } else if (
    (manifest.definitions === null && manifest.checksums.definitions !== null) ||
    (manifest.definitions !== null && manifest.checksums.definitions === null)
  ) {
    errors.push('definitions null state mismatch between model and checksum');
  }

  return { valid: errors.length === 0, errors };
}
