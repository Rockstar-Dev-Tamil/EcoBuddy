# Contributing to EcoBuddy AI

Thank you for your interest in contributing to EcoBuddy AI! We welcome contributions from developers of all skill levels. To maintain a secure, optimized, and readable codebase, please follow the guidelines outlined below.

## Code of Conduct

By participating, you agree to uphold our [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs
If you find a bug, please search existing issues first. If it hasn't been reported, open a new issue with:
- A clear summary.
- Steps to reproduce.
- Expected vs. actual behavior.
- Screenshots if applicable.

### Proposing Features
Have an idea to improve the virtual planet or carbon analysis models? Create an issue outlining:
- The feature's goal and user value.
- Proposed UI designs or algorithm adjustments.

### Submitting Pull Requests (PRs)
1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Ensure you have installed formatting dependencies:
   ```bash
   npm install
   ```
3. Follow our styling guides. JSDoc annotations are required on all newly exported functions.
4. Run ESLint and tests locally:
   ```bash
   npm run lint
   ```
   ```bash
   npm run test
   ```
5. Commit your changes. Husky pre-commit hooks will automatically lint and format your files.
6. Push to your branch and submit a PR to the `main` branch.

## Styling & Quality Guidelines

- **TypeScript:** Use strict types only. Avoid `any` types at all costs.
- **JSDoc:** Exported functions and components should include structured comments describing input parameters, types, and return values.
- **Components:** Wrap visualization charts or dynamic interfaces with accessibility labels and screen-reader alternatives.
