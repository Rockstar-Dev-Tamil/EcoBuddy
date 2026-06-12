# 🛡️ Code Quality & Validation

EcoBuddy AI is designed not just to be a functional product, but an engineered, maintainable, and easily verifiable codebase. We prioritize developer experience, readability, and resilient architecture.

## 📖 Readability & Clean Code

### 1. Architectural Separation of Concerns
The codebase strictly separates presentation from business logic:
- **Pure Functions:** Core logic, such as carbon impact calculations, experience points (XP) scaling, and gamification math, are isolated into pure TypeScript utility functions (e.g., `src/lib/carbon-utils.ts`). This makes them highly predictable and easy to test.
- **Custom Hooks:** React component logic and Supabase state interactions are abstracted into custom hooks (e.g., `useGame`), keeping UI files clean and focused purely on rendering.

### 2. Strict Typing with TypeScript
EcoBuddy AI is built with **100% strict TypeScript**.
- No implicit `any`.
- Everything from Supabase database rows to Framer Motion variant props is strongly typed.
- This ensures that data flowing from external APIs (like Gemini Vision) into the React tree is always predictable, drastically reducing runtime errors.

### 3. Aggressive Linting
We utilize a comprehensive ESLint setup configured for Next.js and React.
- Automatically catches unused variables, unescaped entities, and missing hook dependencies.
- Enforces consistent code style, making the entire project read as if it were written by a single developer.

---

## ✅ Validation & Continuous Integration

EcoBuddy AI is rigorously tested. Any new feature or bug fix must pass an automated GitHub Actions pipeline before merging into `main`.

### 1. Robust Test Suite (Vitest)
The project includes **80+ unit and integration tests** powered by Vitest. Tests run in milliseconds and validate:
- **Math & Utilities:** Ensuring XP thresholds, carbon emission conversions, and planetary offsets are calculated correctly without rounding errors.
- **Sanitization:** Validating that API routes cleanly strip malicious HTML/XSS inputs and reject invalid file uploads (MIME types, sizes).
- **Component Rendering:** React components are tested using `@testing-library/react` to ensure critical UI states (like the Sidebar, Dashboard, and Auth fallback) render exactly as expected.

### 2. The CI Pipeline Quality Gates
Every push triggers our CI workflow (`.github/workflows/ci.yml`), which enforces four strict gates:
1. **Type Checking:** `npx tsc --noEmit` verifies the entire dependency graph has zero type violations.
2. **Linting:** `npm run lint` guarantees stylistic correctness and hygiene.
3. **Tests:** `npm run test` executes the Vitest suite, ensuring no regressions in business logic.
4. **Production Build:** `npm run build` forces a full Next.js optimized compilation, guaranteeing the app will successfully deploy to Vercel without throwing runtime build errors.

By enforcing these practices, EcoBuddy AI ensures that any contributor can easily read the code, understand its purpose, and confidently validate their changes.
