# ADR-0012: Session rotation + mass-invalidation

**Status:** Accepted
**Date:** 2026-06-22

## Context

Fixed session ids enable fixation; credential changes should not leave old sessions valid.

## Decision

Rotate the session id on login; destroy all of a user's sessions on password/email change; enforce both
idle and absolute timeouts via `expires_at`.

## Consequences

Stronger session security; logout-everywhere on credential change is the expected UX.
