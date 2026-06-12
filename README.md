# 🌱 EcoBuddy AI - Carbon Footprint Awareness Platform

[![CI](https://github.com/your-username/ecobuddy/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/ecobuddy/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **See the future you're creating — and build a greener one.** A web app that helps individuals
> **understand, track, and reduce** their personal carbon footprint through
> simple inputs, gamification, and **personalized, AI-generated insights**.

Built as a single, accessible web application: a **Supabase (PostgreSQL)** backend and
a **React + TypeScript (Next.js)** frontend, using **Google Gemini Pro / Vision** for
personalized advice and image analysis, deployed to **Vercel**.

## 🔗 Live demo

**<https://ecobuddy-ai.vercel.app>** *(Placeholder Link)*

> Running on Vercel with live Gemini insights and Supabase-backed tracking.

---

## 1. Chosen vertical

**Sustainability & Climate Awareness** — a tool for everyday individuals who want to understand their emissions and what to actually *do* about them. The product is organised around the three core pillars:

| Pillar | In the product |
| --- | --- |
| **Understand** | Interact with **EcoSnap** to scan receipts and meals, or view the **Earth 2050 Simulator** to visually compare your Business-as-Usual impact versus a Sustainable path. |
| **Track** | Save sustainability logs over time across 6 core categories (Food, Transportation, Electricity, Shopping, Water, Waste) using the interactive **Carbon Calculator**. Positive actions grow vegetation, while unsustainable behaviors lead to pollution and desertification on your **Personalized 3D Planet**. |
| **Reduce** | Chat with **Sprig**, your plant-inspired AI companion, to receive context-aware, personalized recommendations for food, transport, and energy. |

---

## 2. Approach & logic

### The decision flow (smart, context-driven assistant)

```text
User inputs (logs, text chat, receipt/meal photos, carbon calculator)
        │
        ▼
EcoSnap / Sprig (Gemini Vision + Pro)  ──►  Categorized Impact & Suggestions
        │                                          │
        ▼                                          ▼
Supabase Datastore                     Personalized 3D Planet
(Tracks xp, streaks, score)             ├─ Positive: Vegetation & Clean Air
                                        └─ Negative: Pollution & Desertification
        │
        ▼
Gamification Engine  ──►  Level-ups, Daily Challenges, Leaderboard
```

The system goes beyond dry statistics by turning everyday actions into a visual, gamified experience:

1. **AI Sustainability Twin (Sprig):** Instead of overwhelming users with numbers, Sprig explains environmental impact conversationally, identifying large contributors and suggesting realistic alternatives.
2. **Earth 2050 Simulator:** Users can toggle a timeline to see the projected long-term consequences of their current habits side-by-side with a sustainable path.
3. **Carbon Tracker Hub:** A production-grade tracking interface with interactive glassmorphism widgets, smooth Framer Motion animations, and deep Recharts data visualizations.

### Gamified retention model

Footprint awareness is useless if users don't return. EcoBuddy leverages an XP system, daily challenges, and a community leaderboard to promote long-term engagement and consistent behavioral changes.

---

## 3. How the solution works

### Architecture

```text
Browser (Next.js, React Three Fiber)    Vercel (Serverless Functions)
  • 3D Planet UI + Chat      ──HTTP──► Next.js API Routes
  • Upload receipts/meals                 ├─ POST /api/chat     Sprig conversational engine
                                          ├─ POST /api/ecosnap  Gemini Vision processing
                                          └─ GET  /api/metrics  Fetch user history
                                              │
                                              ├─► Google Vertex AI (Gemini 2.5 Pro / Vision)
                                              └─► Supabase (PostgreSQL + Auth)
```

The Next.js framework serves both the frontend application (complete with Three.js visualizations) and the backend serverless API routes. This allows for rapid iteration and simplified deployments to Vercel. 

---

## 4. Vision

EcoBuddy AI aims to transform sustainability from a passive reporting process into an interactive and emotionally engaging journey.

> **"See the future you're creating — and take action to build a greener one."**

---

## 5. Code Quality & Evaluation

The EcoBuddy codebase is engineered to be highly readable, maintainable, and resilient to bugs. We strictly adhere to modern software engineering practices to ensure clean code:

### Readability & Clean Code
- **KISS & DRY Principles:** Core business logic, such as gamification math and carbon emission scaling, is isolated into pure utility functions (`src/lib/carbon-utils.ts`). UI components are kept highly modular and focused.
- **Strict Typing:** Built with full TypeScript strict mode, preventing generic `any` types and ensuring all data structures (from Supabase queries to React props) are completely predictable and type-safe.
- **Linting & Formatting:** We use an aggressive ESLint configuration to enforce clean coding habits—catching unused variables, missing dependencies, and potential bugs early.

### Continuous Evaluation (CI/CD)
Quality is continuously evaluated via a rigorous GitHub Actions pipeline. Every push to the `main` branch must pass multiple automated quality gates:
1. **Unit & Integration Testing:** A comprehensive `vitest` suite (80+ tests) strictly validates the pure logic, math scaling, API sanitization, and React UI interactions.
2. **Type Checking:** `tsc --noEmit` validates the entire project graph for type safety.
3. **Linting:** `npm run lint` guarantees stylistic correctness and hygiene.
4. **Production Build:** `next build` ensures the application can safely be compiled and optimized for Vercel without throwing runtime errors.
