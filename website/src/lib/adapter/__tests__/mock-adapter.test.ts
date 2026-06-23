import { describe, it, expect, beforeEach } from 'vitest';
import type { StorageAdapter } from '../index.js';
import { MockAdapter } from './mock-adapter.js';

describe('MockAdapter', () => {
  let adapter: StorageAdapter;

  beforeEach(() => {
    adapter = new MockAdapter();
  });

  it('satisfies the StorageAdapter interface', () => {
    expect(adapter).toBeDefined();
  });
});
