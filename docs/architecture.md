# Architecture

A single Vercel deployment serves both the Next.js API Routes and the built SPA, keeping
deployment, origin, and operations simple. This document explains the layers
and the reasoning behind them; see the [README](../README.md) for product
context and deployment steps.

## System overview

```text
Browser (React + TS, Next.js)           Vercel (Serverless Environment)
  • accessible UI + 3D Planet  ──HTTP──► Next.js API Routes
  • Carbon Tracker Hub                    ├─ POST /api/chat      Sprig conversational engine
  • anonymous device id (auth)            ├─ POST /api/ecosnap   Gemini Vision processing
                                          ├─ POST /api/entries   save snapshot
                                          ├─ GET  /api/metrics   history
                                          └─ GET  /  (+ assets)  serves built SPA
                                              │
                                              ├─► Google Vertex AI (Gemini) 
                                              └─► Supabase (PostgreSQL + Auth)
```

## Backend layers

| Layer | Module(s) | Rule |
| --- | --- | --- |
| Domain | `src/lib/` | Pure business logic, standard seed data (`mock-seed.ts`), and metric calculations without heavy I/O. |
| Insights | `src/services/gemini/` | External AI integrations (e.g., `ecosnap.ts`). It translates image/text into actionable insights via Vertex AI/Gemini. |
| Persistence | `src/services/` | Supabase services and mock DB fallbacks (`mock-db.ts`). Handled abstractly so the app can degrade gracefully if the remote DB is down. |
| Transport | `src/app/api/` | Thin Next.js serverless routes. They validate input parameters and pass payloads to the services layer. |

Design rules the codebase follows:

- **Dependencies point inward.** UI components depend on hooks, hooks depend on services.
- **Graceful degradation.** Both Gemini and Supabase can gracefully failover to mock equivalents for local development.

## Frontend structure

| Concern | Location |
| --- | --- |
| State + API orchestration | `src/app/simulator/hooks/` and generic React hooks |
| Presentation | `src/components/`, `src/app/simulator/components/`, and `src/app/carbon-tracker/` |
| Client Utilities | `src/lib/` (types, local storage wrappers, carbon calculation logic) |

## Quality gates

Every push to main runs linting (ESLint), type checks (`tsc --noEmit`), unit tests (`vitest`), and a full production build (`next build`) within our GitHub Actions workflow. See `.github/workflows/ci.yml`.
