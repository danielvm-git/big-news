# ADR-0006: S3-compatible storage default; local FS dev-only

**Status:** Accepted
**Date:** 2026-06-22

## Context

Local-filesystem uploads break on Vercel/Netlify (ephemeral) and across multiple instances.

## Decision

Default to **S3-compatible** storage (`@aws-sdk/client-s3`; MinIO/R2/BigBase). Local FS is selectable
via `STORAGE_DRIVER=local` for single-instance/dev only and documented as non-durable.

## Consequences

Works on all advertised hosts. Requires S3 credentials for production; dev can stay on local FS.
