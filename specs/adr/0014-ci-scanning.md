# ADR-0014: CI dependency + secret scanning, generic errors

**Status:** Accepted
**Date:** 2026-06-22

## Context

An OSS project others deploy must catch vulnerable deps, committed secrets, and avoid leaking internals.

## Decision

CI runs `npm audit`/Dependabot and `gitleaks`, blocking on high-severity findings. API errors map to
generic messages (no DB/schema text or stack traces).

## Consequences

Supply-chain and secret hygiene enforced in CI; error responses reveal nothing exploitable.
