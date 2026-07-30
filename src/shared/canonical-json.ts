import { createHash } from 'node:crypto';

// ============================================================================
// Canonical JSON — Deterministic serialization for checksum stability
// ============================================================================

/**
 * Recursively canonicalize a value so that JSON.stringify produces identical
 * output regardless of insertion order.
 *
 * Rules:
 *   - Object keys are sorted alphabetically.
 *   - Arrays of objects with an `id` property are sorted by `id`.
 *   - Other arrays are sorted by their JSON representation (lexicographically).
 *   - All nested structures are recursively canonicalized.
 *   - `undefined` values are stripped (JSON.stringify already does this).
 */
function canonicalize(obj: unknown): unknown {
  // Primitives and null — pass through
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Arrays
  if (Array.isArray(obj)) {
    const mapped = obj.map((el) => canonicalize(el));

    // Determine sort strategy
    const allObjectsWithId =
      mapped.length > 0 &&
      mapped.every(
        (el) => el !== null && typeof el === 'object' && 'id' in (el as Record<string, unknown>),
      );

    if (allObjectsWithId) {
      mapped.sort((a, b) => {
        const idA = String((a as Record<string, unknown>).id);
        const idB = String((b as Record<string, unknown>).id);
        return idA < idB ? -1 : idA > idB ? 1 : 0;
      });
    } else {
      // Natural sort: compare by string representation
      mapped.sort((a, b) => {
        const sa = JSON.stringify(a);
        const sb = JSON.stringify(b);
        return sa < sb ? -1 : sa > sb ? 1 : 0;
      });
    }

    return mapped;
  }

  // Objects — sort keys alphabetically
  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    const val = (obj as Record<string, unknown>)[key];
    // Skip undefined values (JSON.stringify drops them anyway)
    if (val === undefined) continue;
    sorted[key] = canonicalize(val);
  }
  return sorted;
}

/**
 * Serialize a value to a deterministic JSON string.
 *
 * Guarantee: for any two structurally-equal values, canonicalStringify
 * produces identical output bytes, regardless of property insertion order
 * or array order.
 */
export function canonicalStringify(obj: unknown): string {
  const canonical = canonicalize(obj);
  return JSON.stringify(canonical);
}

/**
 * Compute a SHA-256 checksum of a value via canonical JSON serialization.
 */
export function computeChecksum(value: unknown): string {
  const json = canonicalStringify(value);
  return createHash('sha256').update(json).digest('hex');
}
