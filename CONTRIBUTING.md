# Contributing to Water Credits Frontend

Thank you for your interest in contributing! We welcome contributions from everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold its terms.

## Getting Started

### Prerequisites

- **Node.js** >= 22.x
- **npm** >= 11.x
- **Git**

### Setup

```bash
# Clone the repository
git clone https://github.com/water-credits/water-credits-frontend
cd water-credits-frontend

# Install dependencies
npm install

# Copy environment config
cp src/environments/environment.ts.example src/environments/environment.ts

# Start the dev server
ng serve
```

The app will be available at `http://localhost:4200`.

## Development Workflow

### Branch Naming

Use descriptive branch names with a conventional prefix:

- `feat/` — New features (e.g., `feat/sensor-gauge-component`)
- `fix/` — Bug fixes (e.g., `fix/login-redirect-loop`)
- `refactor/` — Code restructuring (e.g., `refactor/state-management`)
- `chore/` — Maintenance tasks (e.g., `chore/update-dependencies`)
- `docs/` — Documentation changes (e.g., `docs/api-endpoints`)

### Local Development

```bash
# Run the development server
npm start

# Run tests in watch mode
npm test

# Lint and format
npm run lint
npm run format

# Build for production
npm run build
```

### Pre-commit Hooks

This project uses **Husky** and **lint-staged** to automatically:

- Format staged files with Prettier
- Lint staged TypeScript files with ESLint

If a commit fails, fix the reported issues and try again.

## Project Structure

```
src/
  app/
    core/           # Singleton services, guards, models, NgRx store
    features/       # Lazy-loaded feature modules (standalone components)
    shared/         # Reusable components, directives, pipes, layouts
  environments/     # Environment configuration
  theme/            # SCSS design tokens and utilities
```

- **Core** — Everything that should only be instantiated once (services, guards, store).
- **Features** — Each feature module is lazy-loaded via the Angular Router.
- **Shared** — Reusable components, directives, pipes, and layout components.

## Coding Standards

### Angular

- Follow the [Angular Style Guide](https://angular.dev/style-guide)
- All components use `ChangeDetectionStrategy.OnPush`
- All components are **standalone** (no `NgModule`)
- Lazy-load feature modules via route configuration
- One component per folder: `my-feature/my-feature.ts` + `.html` + `.scss` + `.spec.ts`

### TypeScript

- **Strict mode** is enabled — avoid `any` unless absolutely necessary
- Use explicit visibility modifiers (`private`, `protected`, `public`)
- Prefer `readonly` for immutable properties
- Use `const` over `let` where possible
- Use interfaces over type aliases for object shapes
- Mark override methods with `override` keyword

### Naming Conventions

| Type           | Convention                  | Example                         |
| -------------- | --------------------------- | ------------------------------- |
| Components     | `feature-type.component.ts` | `sensor-dashboard.component.ts` |
| Services       | `feature.service.ts`        | `credits.service.ts`            |
| Models         | `entity.model.ts`           | `credit.model.ts`               |
| NgRx actions   | `feature.actions.ts`        | `auth.actions.ts`               |
| NgRx reducers  | `feature.reducer.ts`        | `auth.reducer.ts`               |
| NgRx selectors | `feature.selectors.ts`      | `credits.selectors.ts`          |
| NgRx effects   | `feature.effects.ts`        | `sensors.effects.ts`            |
| Pipes          | `transform.pipe.ts`         | `truncate.pipe.ts`              |
| Directives     | `behavior.directive.ts`     | `click-outside.directive.ts`    |

### SCSS & Styling

- Use **Tailwind utility classes** for most styling
- Use SCSS variables from `theme/_variables.scss` for design tokens
- Avoid magic values — use the design system tokens
- Component styles should be scoped (default Angular behavior)
- Dark mode is supported via the `.dark` class on `<html>`

### State Management (NgRx)

- **Actions** — Use the `[Source] Event` naming pattern (e.g., `[Auth] Login Success`)
- **Effects** — Handle side effects (API calls, WebSocket, wallet interactions)
- **Selectors** — Create memoized selectors with `createSelector`
- **Reducers** — Immutable updates only; use `@ngrx/entity` where applicable

## Commit Convention

This project uses **conventional commits** with **commitlint**. Every commit message must follow the format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type       | Usage                                                   |
| ---------- | ------------------------------------------------------- |
| `feat`     | A new feature                                           |
| `fix`      | A bug fix                                               |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `style`    | Formatting, missing semicolons, etc. (no code change)   |
| `test`     | Adding or updating tests                                |
| `docs`     | Documentation only changes                              |
| `chore`    | Build process, tooling, dependencies                    |
| `perf`     | Performance improvements                                |
| `ci`       | CI configuration changes                                |

### Scope

The scope should be the feature area (e.g., `dashboard`, `sensors`, `marketplace`, `auth`, `core`).

### Examples

```
feat(sensors): add real-time sensor gauge component
fix(auth): resolve login redirect loop on expired tokens
refactor(core): migrate signals to resource API
test(credits): add unit tests for credit portfolio selectors
docs(readme): update API endpoint documentation
```

## Pull Request Process

1. **Create a branch** from `main` with a descriptive name
2. **Make your changes** following the coding standards
3. **Write or update tests** — aim for at least 80% coverage on new code
4. **Run the full test suite** — `npm test` must pass
5. **Run lint** — `npm run lint` must pass with zero warnings
6. **Run the build** — `npm run build` must succeed
7. **Keep PRs focused** — one feature/fix per PR; large changes should be broken into smaller PRs
8. **Write a clear description** — explain what the PR does and why
9. **Link related issues** — use `Closes #123` in the description

### PR Review

- At least one maintainer review is required
- Address all review comments before merging
- Squash-merge commits into `main` with a clean message

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test -- --code-coverage

# Run tests for a specific file
npm run test -- --include src/app/features/sensors/sensors-dashboard
```

### Testing Conventions

- Write unit tests for all components, services, and NgRx store slices
- Use Vitest (configured via `@angular/build:unit-test`)
- Use `@ngrx/store/testing` for store tests
- Mock external services (API, WebSocket, Freighter wallet)
- Follow the existing test patterns in the codebase

## Reporting Issues

### Bug Reports

Open a [bug report](https://github.com/water-credits/water-credits-frontend/issues/new?template=bug_report.md) with:

- A clear, descriptive title
- Steps to reproduce
- Expected vs. actual behavior
- Screenshots if applicable
- Environment details (browser, OS, wallet extension)

### Feature Requests

Open a [feature request](https://github.com/water-credits/water-credits-frontend/issues/new?template=feature_request.md) with:

- A clear description of the problem or need
- Proposed solution
- Alternative approaches considered
- Any relevant context or examples

## Development Tips

### Adding a New Feature Module

```bash
ng g @angular/core:standalone --type=component features/my-feature/my-feature
```

Then add the route in `src/app/app.routes.ts` with lazy loading.

### Working with NgRx

```bash
ng g @angular/core:standalone --type=component features/my-feature/my-feature
# Then manually create:
#   store/my-feature.actions.ts
#   store/my-feature.reducer.ts
#   store/my-feature.selectors.ts
#   store/my-feature.effects.ts
```

### Wallet Integration

The app uses `@stellar/freighter-api` for Stellar wallet connectivity. See `src/app/core/services/wallet.service.ts` for reference.

---

## Questions?

If you have questions or need help, open a [discussion](https://github.com/water-credits/water-credits-frontend/discussions) or reach out via [Telegram (@Escelit)](https://t.me/Escelit) or email [ogazipromise81@gmail.com](mailto:ogazipromise81@gmail.com). For security vulnerabilities, use email — do not open a public issue.

Thank you for contributing! 🚀
