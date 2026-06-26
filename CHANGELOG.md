# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-06-26

### Added

- Astro 5+ SSR project scaffold with i18n (en, pt-br)
- Development toolchain: Husky, commitlint, Prettier
- CI pipeline with Postgres service container
- Test infrastructure: unit (Vitest, mock adapter) + integration (disposable Postgres)
- Structured JSON logger with secrets redaction (ADR-0018)
- Request instrumentation middleware with correlation IDs
- Zod input validation helpers (ADR-0015)
- BigBase-style footer with 3-column layout and version bar
- Design tokens (CSS variables) for BigBase theme
- Build-time version injection via `PUBLIC_APP_VERSION`
<!--

Template for future entries:

## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security

-->
