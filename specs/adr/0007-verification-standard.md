# ADR-0007: Gherkin scenarios as the acceptance gate

**Status:** Accepted
**Date:** 2026-06-22

## Context

`grep -q 'fn'` passes on a stub that throws — string-existence checks are false-positive gates.

## Decision

Each story's **Gate** is its Gherkin scenarios implemented as vitest/Playwright tests. The `verify:`
shell snippets in task lists are scaffolding sanity checks only, never the acceptance gate.

## Consequences

Behavioral gates close the verification hole; writing tests-first is mandatory (develop-tdd).
