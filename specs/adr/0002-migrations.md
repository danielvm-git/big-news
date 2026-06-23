# ADR-0002: Versioned migrations via node-pg-migrate + advisory lock

**Status:** Accepted
**Date:** 2026-06-22

## Context

"Run schema.sql on every boot" has no versioning and races across multi-instance/serverless cold starts.

## Decision

Use **node-pg-migrate** with reversible, versioned migrations, executed under a `pg_advisory_lock`
so concurrent startups serialize and apply the schema exactly once. Migrations use a separate,
more-privileged role than the runtime role (see ADR-0016).

## Consequences

Safe schema evolution post-v1; adds a migration toolchain dependency and a boot-time lock step.
