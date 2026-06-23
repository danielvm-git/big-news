import { describe, it, expect } from 'vitest';

/**
 * Foundation sanity test — proves the unit lane runs in the local pre-push gate
 * and in CI. Replaced by real unit tests as the data layer and helpers land.
 */
describe('foundation', () => {
  it('runs the unit test lane', () => {
    expect(1 + 1).toBe(2);
  });
});
