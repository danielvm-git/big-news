# ADR-0005: Sanitize rich-text HTML on write

**Status:** Accepted
**Date:** 2026-06-22

## Context

Article content is rendered with `set:html` — a stored-XSS sink. TipTap/DeepL output is untrusted.

## Decision

Run all rich-text through **sanitize-html** (allowlist) **on write** so stored content is always clean.
Render trusts the stored (already-sanitized) HTML; CSP (ADR-0009) is defense-in-depth.

## Consequences

Stored content is safe even if a render path forgets to sanitize. Allowlist must track TipTap features.
