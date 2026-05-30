# Contributing to Outline VPN Manager

Thank you for your interest in contributing! This document outlines the process for submitting changes.

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally
3. **Create a branch** from `main` for your changes

## Development Workflow

1. **Branch naming**: Use descriptive names like `feat/add-search`, `fix/loading-state`, or `docs/update-readme`
2. **Make your changes** with clear, focused commits
3. **Test thoroughly** — ensure the app builds (`npm run build`) and the dev server runs without errors
4. **Open a Pull Request** against the `main` branch with a clear description of what changed and why

## Commit Convention

All commits **must** follow [Git Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation changes
- `style` — Code style changes (formatting, no logic change)
- `refactor` — Code refactoring
- `perf` — Performance improvements
- `test` — Adding or updating tests
- `chore` — Build process, dependencies, tooling

**Examples:**
```
feat(keys): add bulk delete action
fix(proxy): handle network timeout errors
docs(readme): update API setup instructions
```

## Code Standards

- TypeScript strict mode is enabled — no `any` types without justification
- Follow existing code style and patterns
- Keep components focused and reusable
- Add comments for complex logic only

## Questions?

Open an issue for discussion before major changes.
