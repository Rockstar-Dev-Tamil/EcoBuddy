# EcoBuddy Testing Framework

This document describes the structure, validation gates, and execution of test suites inside the EcoBuddy AI codebase.

## 1. Test Architecture

The codebase separates tests into distinct layers:
1. **Unit Tests (`tests/unit`):** Fast, zero-dependency validation of pure calculation functions, JSDoc utilities, input sanitization routines, and edge cases.
2. **Integration Tests (`tests/integration`):** Validating React rendering trees, component states (e.g. navigation elements, analytics breakdowns), MockDB operations, and layout structures.
3. **E2E Smoke Tests (`tests/e2e`):** Playwright automated browser tests simulating landing navigations, auth flows, and client dashboard metrics.

---

## 2. Test Execution Commands

Run test suites using the following scripts configured in `package.json`:

```bash
# Execute the full Vitest unit & integration test suite
npm run test

# Run Vitest in watch mode for active development
npm run test:watch

# Execute E2E tests using Playwright
npx playwright test

# Generate a complete coverage report using Vitest v8 coverage provider
npm run test:coverage
```

---

## 3. Boundary & Edge Cases Coverage

Our unit tests (`tests/unit/edge-cases.test.ts`) target calculations with invalid inputs to prevent app failures:
- **XP Progression bounds:** Verifies negative XP is defaulted to level 1 and checks calculations on extremely high level values (e.g. 1M XP).
- **Green Score Clamping:** Assures that score application never exceeds `100` and never drops below `10`.
- **Zero Division Checks:** Ensures Carbon Detective severity and aggregation methods handle zero total emissions safely without producing `NaN` errors.
- **OCR Categories mapping:** Checks that abbreviated scanner codes correctly fall back to standard schemas.

---

## 4. Continuous Integration Gates

Every merge request runs through our GitHub Actions CI pipeline executing:
- Lint stylistic validations (`npm run lint`)
- Type check completeness (`npx tsc --noEmit`)
- Full Vitest testing coverage (`npm run test`)
- Next.js production bundler builds (`npm run build`)
