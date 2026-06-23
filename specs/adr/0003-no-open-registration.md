# ADR-0003: No public registration — seed/CLI admin only

**Status:** Accepted
**Date:** 2026-06-22

## Context

A self-hosted CMS with a public register route lets anyone mint admin accounts on every deployment.

## Decision

There is **no public registration route**. The first admin is created by `scripts/seed.ts` / CLI;
further admins are created from within the panel by an existing admin.

## Consequences

Removes a major attack surface. Success criteria reworded from "register → login" to "seed admin → login".
