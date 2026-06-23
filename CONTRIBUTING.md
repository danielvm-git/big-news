# Contributing to big-news

Thank you for considering contributing to big-news!

## Code of Conduct

This project follows a standard Code of Conduct. Please be respectful and constructive.

## How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Make your changes following the project conventions
4. Ensure all tests pass: `pnpm preflight`
5. Commit using Conventional Commits
6. Open a Pull Request

## Development Setup

See the [README](README.md) for setup instructions.

## Conventions

- All code, comments, and documentation are in **English** (ADR-0020)
- Follow Conventional Commits (`type(scope): description`)
- Keep functions small (4–20 lines) and files under 300 lines
- No `console.*` — use the structured logger
- Tests verify behavior through public interfaces
- Leave code cleaner than you found it

## Pull Request Guidelines

- Keep PRs focused on a single concern
- Update documentation if needed
- Add tests for new functionality
- Ensure CI passes
