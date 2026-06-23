# ADR-0018: Observability is foundational, not polish

**Status:** Accepted
**Date:** 2026-06-22

## Context

Logging wired late (e07) contradicts the "no console.\* — use the logger" rule that applies from e02.
Same class of sequencing bug as i18n-as-late-epic.

## Decision

Structured JSON logging + request-id + secret redaction (`src/lib/logger.ts`) and the zod validation
helper land in **e01** so every later module instruments/validates from line one. Health/readiness
endpoints land with the data layer. Metrics/tracing are out of scope for v1.

## Consequences

No logging retrofit; consistent request logs and validation across the codebase from the start.
