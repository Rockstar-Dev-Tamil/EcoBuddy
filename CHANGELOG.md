# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-06-13

### Added
- **Goals Tracking System:** Introduced `GoalsWidget` on the dashboard to track weekly carbon budgets (25kg CO2 limit) and green logging targets (5 actions/week).
- **Badge System:** Configured visual user status levels: Seed 🌱, Sprout 🌿, Plant (Green Warrior) ♻️, Tree (Planet Protector) 🌲, Forest Guardian 🌎.
- **Permanent Offline Sandbox Mode:** Added auth bypass controls on the landing page, enabling guests to access dashboard states without setting up external database connections.
- **PWA Service Worker:** Created Web manifest and registration workflows to make the web app fully installable and support basic offline fallback.
- **Testing Suite expansion:** Restructured tests folder into unit, integration, and E2E subdirectories. Added comprehensive test files covering mathematical boundaries and inputs.
- **Playwright configuration:** Set up smoke testing specs to execute browser checks automatically.
- **Security documentation:** Created docs covering API validation schemas, DOMPurify sanitization, HSTS config, and IP rate limit parameters.

### Changed
- **JSDoc Annotation:** Annotated calculations inside `carbon-utils.ts`, `storage-utils.ts`, and core store hooks with detailed parameters and description comments.
- **Refactoring:** Moved static emission configurations from utilities to separate constants directory (`src/constants/carbon.ts`).
- **Accessibility updates:** Audited and updated the visual analytics screen, wrapping Recharts circles with status logs and fallback alternative descriptions.
- **HSTS Headers:** Enabled HTTP Strict-Transport-Security response header within Next.js config rules.
