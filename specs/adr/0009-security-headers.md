# ADR-0009: CSP + standard security headers

**Status:** Accepted
**Date:** 2026-06-22

## Context

A CMS rendering `set:html` needs defense-in-depth behind sanitization.

## Decision

Middleware sets a Content-Security-Policy plus `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
HSTS, and `frame-ancestors 'none'` on every response. CSP image-src includes the upload origin.

## Consequences

Injected inline script is blocked even if sanitization were bypassed; CSP must be tuned to allowed assets.
