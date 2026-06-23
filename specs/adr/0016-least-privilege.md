# ADR-0016: Least-privilege runtime credentials

**Status:** Accepted
**Date:** 2026-06-22

## Context

Conference "Deploy: Security Engineer" practice: set a least-privilege service account before shipping.

## Decision

The app's runtime Postgres role has DML on its own tables only — no DDL/superuser (migrations use a
separate role, ADR-0002). S3 keys are scoped to one bucket with only needed actions. Secrets via env only.

## Consequences

Blast radius of a compromised app credential is minimized; ops must manage two DB roles.
