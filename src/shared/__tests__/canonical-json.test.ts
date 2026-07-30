import { describe, it, expect } from 'vitest';
import { canonicalStringify, computeChecksum } from '../canonical-json.js';

// ============================================================================
// canonicalStringify & computeChecksum — determinism unit tests
// ============================================================================

describe('canonicalStringify', () => {
  // ---- Primitive values ----------------------------------------------------

  it('serializes strings', () => {
    expect(canonicalStringify('hello')).toBe('"hello"');
  });

  it('serializes numbers', () => {
    expect(canonicalStringify(42)).toBe('42');
  });

  it('serializes booleans', () => {
    expect(canonicalStringify(true)).toBe('true');
    expect(canonicalStringify(false)).toBe('false');
  });

  it('serializes null', () => {
    expect(canonicalStringify(null)).toBe('null');
  });

  // ---- Key-order independence ----------------------------------------------

  it('produces identical output regardless of insertion order', () => {
    const a = { z: 1, a: 2, m: 3 };
    const b = { m: 3, a: 2, z: 1 };
    const c = { a: 2, z: 1, m: 3 };

    const out = canonicalStringify(a);
    expect(canonicalStringify(b)).toBe(out);
    expect(canonicalStringify(c)).toBe(out);
    // Verify alphabetical order
    expect(out).toBe('{"a":2,"m":3,"z":1}');
  });

  // ---- Nested objects ------------------------------------------------------

  it('sorts keys in nested objects', () => {
    const obj = {
      inner: { b: 2, a: 1 },
      outer: 1,
    };
    expect(canonicalStringify(obj)).toBe('{"inner":{"a":1,"b":2},"outer":1}');
  });

  // ---- Array sorting (by id) -----------------------------------------------

  it('sorts arrays of objects by id when all elements have ids', () => {
    const arr = [
      { id: 'c', value: 3 },
      { id: 'a', value: 1 },
      { id: 'b', value: 2 },
    ];
    expect(canonicalStringify(arr)).toBe(
      '[{"id":"a","value":1},{"id":"b","value":2},{"id":"c","value":3}]',
    );
  });

  it('does not sort by id if not all elements have ids', () => {
    const arr = [
      { id: 'b', value: 2 },
      { value: 1 },
      { id: 'a', value: 3 },
    ];
    const out = canonicalStringify(arr);
    // Should fall back to string-repr sort, not throw
    const parsed = JSON.parse(out);
    expect(parsed).toHaveLength(3);
  });

  // ---- Array sorting (natural) ---------------------------------------------

  it('sorts primitive arrays lexicographically by JSON representation', () => {
    const arr = [3, 1, 2];
    expect(canonicalStringify(arr)).toBe('[1,2,3]');
  });

  it('sorts string arrays lexicographically', () => {
    const arr = ['banana', 'apple', 'cherry'];
    expect(canonicalStringify(arr)).toBe('["apple","banana","cherry"]');
  });

  it('sorts arrays of arrays', () => {
    const arr = [[2], [1]];
    expect(canonicalStringify(arr)).toBe('[[1],[2]]');
  });

  // ---- Undefined stripping -------------------------------------------------

  it('strips undefined values', () => {
    const obj = { a: 1, b: undefined, c: 3 };
    expect(canonicalStringify(obj)).toBe('{"a":1,"c":3}');
  });

  // ---- Empty structures ----------------------------------------------------

  it('handles empty objects', () => {
    expect(canonicalStringify({})).toBe('{}');
  });

  it('handles empty arrays', () => {
    expect(canonicalStringify([])).toBe('[]');
  });

  // ---- Mixed nested structures ---------------------------------------------

  it('handles deeply nested mixed structures', () => {
    const obj = {
      pages: [
        { id: 'page-2', name: 'about' },
        { id: 'page-1', name: 'index' },
      ],
      meta: { version: '1.0.0', generatedAt: '2024-01-01T00:00:00Z' },
    };
    const out = canonicalStringify(obj);
    const parsed = JSON.parse(out);
    expect(parsed.pages[0].id).toBe('page-1');
    expect(parsed.pages[1].id).toBe('page-2');
    // meta keys should be alphabetical
    const metaKeys = Object.keys(parsed.meta);
    expect(metaKeys).toEqual(['generatedAt', 'version']);
  });
});

describe('computeChecksum', () => {
  it('returns a 64-character hex string', () => {
    const hash = computeChecksum({ a: 1 });
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces identical checksums for identical data regardless of insertion order', () => {
    const a = { z: { deep: true }, a: [3, 2, 1] };
    const b = { a: [1, 2, 3], z: { deep: true } };

    expect(computeChecksum(a)).toBe(computeChecksum(b));
  });

  it('produces different checksums for different data', () => {
    expect(computeChecksum({ a: 1 })).not.toBe(computeChecksum({ a: 2 }));
  });

  it('is stable across calls', () => {
    const data = { nested: { arr: [{ id: 'x', v: 1 }, { id: 'a', v: 2 }], str: 'hello' } };
    const h1 = computeChecksum(data);
    const h2 = computeChecksum(data);
    expect(h1).toBe(h2);
  });
});
