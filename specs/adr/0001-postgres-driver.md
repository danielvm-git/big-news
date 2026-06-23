# ADR-0001: Single DB driver — postgres.js

**Status:** Accepted
**Date:** 2026-06-22

## Context

The CMS must run on VPS/Docker/standalone and serverless, against BigBase/Neon/Supabase.
The original plan left "@neondatabase/serverless OR postgres.js" unresolved — different APIs and pooling.

## Decision

Use **postgres.js** (`postgres`) as the single driver. TCP works everywhere; the default host is the
Node adapter, so no edge driver is needed in v1. Edge/Neon-serverless can be added later behind the adapter.

## Consequences

One connection module, one mental model. Edge deploys on Neon would need their driver added later.
