# ADR-0004: Thin storage-adapter seam (one impl, mockable)

**Status:** Accepted
**Date:** 2026-06-22

## Context

Out-of-scope forbids a plugin system as premature, yet a contract is useful for testing and future backends.

## Decision

Keep a **thin** interface over DB+Auth+Storage with a single Postgres implementation. Its primary
justification is the **test seam** — a mock adapter (mirroring upstream `mock-appwrite.ts`) powers unit/API
tests without a DB. Not a plugin system.

## Consequences

Fast, deterministic unit tests; a small abstraction cost. A second backend would reuse the contract.
