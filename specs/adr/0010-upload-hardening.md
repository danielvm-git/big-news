# ADR-0010: Uploads re-encoded, sniffed, served untrusted

**Status:** Accepted
**Date:** 2026-06-22

## Context

MIME is client-asserted; images can be polyglots; SVG executes script; filenames can traverse.

## Decision

Validate by magic bytes, **re-encode** raster images (strip EXIF/payloads), **block SVG**, sanitize
filenames/keys, enforce a size cap before buffering (413), and serve user files from a separate origin
or with `Content-Disposition: attachment` + fixed `Content-Type`.

## Consequences

Closes upload-as-XSS and traversal/DoS vectors; adds an image-processing dependency (e.g. sharp).
