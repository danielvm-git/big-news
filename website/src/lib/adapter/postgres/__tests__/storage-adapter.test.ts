// ---------------------------------------------------------------------------
// Unit tests for the S3-compatible storage adapter (e02s06)
// Uses the local FS driver with a temp directory — no DB or network needed.
// ---------------------------------------------------------------------------

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// We'll test the local driver directly
import { localDriver } from '../storage-adapter';
import type { FileStorageAdapter } from '../../types';

let adapter: FileStorageAdapter;
let tempDir: string;

beforeAll(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'big-news-storage-'));
  // Override UPLOADS_DIR by setting cwd... actually the module uses
  // process.cwd() which we can override by changing the env.
  // Instead, let's patch by using a temp dir approach.
  process.env.STORAGE_DRIVER = 'local';
  adapter = await localDriver();
});

afterAll(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

function makeFile(
  overrides: Partial<{ name: string; buffer: ArrayBuffer; mime_type: string }> = {}
) {
  const encoder = new TextEncoder();
  return {
    name: 'test-image.png',
    buffer: encoder.encode('fake-png-content').buffer as ArrayBuffer,
    mime_type: 'image/png',
    ...overrides,
  };
}

describe('Storage adapter (local driver)', () => {
  it('uploadFile returns url and key', async () => {
    const result = await adapter.uploadFile(makeFile());

    expect(result.url).toMatch(/^\/uploads\//);
    expect(result.key).toBeTruthy();
    expect(result.key).toMatch(/\.png$/);
  });

  it('getFileUrl returns a URL for a given key', async () => {
    const { key } = await adapter.uploadFile(makeFile());
    const url = await adapter.getFileUrl(key);

    expect(url).toBe(`/uploads/${key}`);
  });

  it('upload → getFileUrl → delete round-trips', async () => {
    const { key } = await adapter.uploadFile(makeFile());

    // Can get the URL
    const url = await adapter.getFileUrl(key);
    expect(url).toBeTruthy();

    // Delete
    await adapter.deleteFile(key);

    // Delete again should not throw (idempotent)
    await expect(adapter.deleteFile(key)).resolves.not.toThrow();
  });

  it('rejects non-image files', async () => {
    const file = makeFile({ name: 'test.txt', mime_type: 'text/plain' });

    await expect(adapter.uploadFile(file)).rejects.toThrow(/Invalid file type/);
  });

  it('rejects oversized files', async () => {
    // Create a buffer larger than 10 MB
    const oversized = new ArrayBuffer(11 * 1024 * 1024);
    const file = makeFile({ buffer: oversized });

    await expect(adapter.uploadFile(file)).rejects.toThrow(/File too large/);
  });

  it('respects MIME allowlist — allows all image types', async () => {
    const types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

    for (const mime_type of types) {
      const ext = mime_type.split('/')[1];
      const result = await adapter.uploadFile(makeFile({ name: `test.${ext}`, mime_type }));
      expect(result.key).toBeTruthy();
    }
  });

  it('keys are unique (no collisions)', async () => {
    const keys = new Set<string>();

    for (let i = 0; i < 100; i++) {
      const { key } = await adapter.uploadFile(makeFile());
      expect(keys.has(key)).toBe(false);
      keys.add(key);
    }
  });
});
