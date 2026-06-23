# ADR-0008: DeepL translation is optional (feature-flagged)

**Status:** Accepted
**Date:** 2026-06-22

## Context

DeepL needs a paid API key and network access; making it a hard dependency blocks the core CMS.

## Decision

Gate DeepL on `DEEPL_API_KEY`. The translate control is hidden/disabled when unset; the proxy is
auth-gated, rate-limited, and size-capped (ADR-0013). Tests mock the DeepL client.

## Consequences

Core CMS runs with zero external AI dependency; translation is an opt-in enhancement.
