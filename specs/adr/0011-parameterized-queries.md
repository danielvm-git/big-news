# ADR-0011: Parameterized queries only

**Status:** Accepted
**Date:** 2026-06-22

## Context

String-concatenated SQL (esp. search, dynamic ORDER BY/pagination) is an injection vector.

## Decision

All DB access uses postgres.js tagged templates. Dynamic identifiers (sort/order/pagination) map through
allowlists, never interpolation. A lint rule / test asserts no raw interpolation of user input.

## Consequences

SQL injection foreclosed; dynamic sorting requires explicit allowlists.
