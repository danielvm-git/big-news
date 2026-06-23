# ADR-0015: Schema-based input validation at every API boundary

**Status:** Accepted
**Date:** 2026-06-22

## Context

Output sanitization (ADR-0005) does not validate request inputs. The Claude dev-conference "Deploy:
Security Engineer" practice flagged exactly this: "found missing input validation → add schema check."

## Decision

Every `/api/*` route parses body/query/params through a **zod** schema and returns 400 on invalid input
before any logic. A route-coverage sweep test fails if any handler reads input without a schema.

## Consequences

Malformed/hostile input rejected uniformly; each new endpoint must declare a schema.
