# ADR-0017: /security-review is a mandatory pre-deploy gate

**Status:** Accepted
**Date:** 2026-06-22

## Context

Conference "Deploy: Security Engineer" — "Nothing ships without my review."

## Decision

Run `/security-review` on the release diff before every deploy; fix findings and re-review until clean.
This is a hard gate in e08 (Demo Deploy) alongside the e07 security-hardening gate.

## Consequences

No release ships unreviewed; adds a review/fix loop to the deploy path.
