# ADR-0013: Shared (DB-backed) rate limiting

**Status:** Accepted
**Date:** 2026-06-22

## Context

big-news supports multi-instance/serverless hosting where in-memory limiters are bypassed across instances.

## Decision

Login/translate/upload throttles persist in Postgres (table + window) so limits hold cluster-wide.

## Consequences

Consistent throttling at scale; a small per-request DB cost on guarded routes.
