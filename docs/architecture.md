# 🏗️ Technical Architecture & System Design

EcoBuddy AI is deployed as a single, unified Vercel deployment that serves both the Next.js App Router SPA and serverless API endpoints. The architecture emphasizes modularity, graceful degradation, and high-performance WebGL rendering.

## 🌐 1. High-Level System Overview

```text
Browser Client (React + Next.js App Router)         Vercel Serverless Platform
  ├─ Zustand Global State                              │
  ├─ React Three Fiber (WebGL 3D Planet)      ──HTTP──► Next.js API Routes (Node.js)
  ├─ Framer Motion (Hardware Accel. UI)                ├─ Input Sanitization Middleware
  └─ Recharts (Data Visualization)                     ├─ POST /api/chat     (Gemini Engine)
                                                       ├─ POST /api/ecosnap  (Vision Engine)
                                                       ├─ POST /api/entries  (Log Sync)
                                                       └─ GET  /api/metrics  (Data Fetch)
                                                           │
                      ┌────────────────────────────────────┴─────────────────────────────┐
                      ▼                                                                  ▼
        Google Cloud Platform (AI Layer)                              Supabase (Data Layer)
        ├─ Vertex AI (Gemini 2.5 Pro)                                 ├─ PostgreSQL (Relational DB)
        ├─ Gemini Vision (Multi-modal)                                ├─ Row Level Security (RLS)
        └─ Google Cloud Vision API (OCR)                              └─ GoTrue Auth Services
```

---

## 🛠️ 2. Frontend Architecture (React + Next.js)

### State Management (`src/stores/`)
We avoid prop-drilling by utilizing **Zustand** (or a generic React Context Store) for global state management (`useGame`).
- **Planet State:** Tracks parameters like `vegetation`, `pollution`, and `desertification` which are deterministically derived from the user's historical carbon offset logs.
- **User Profile:** Tracks XP, level, and authentication status.

### The Presentation Layer (`src/components/`)
UI components strictly follow the **"Dumb Components"** pattern. They do not fetch their own data; they receive data via props or global hooks.
- **Performance:** We utilize `React.memo` and `useMemo` heavily to prevent unnecessary re-renders of the expensive 3D planet canvas when UI layers (like chat or dashboard widgets) update.
- **Animations:** UI transitions utilize `framer-motion` optimized for GPU acceleration (`transform` and `opacity` properties) rather than triggering browser layout recalculations.

### The 3D Rendering Engine (`src/features/planet-3d/`)
Built with **Three.js** and **React Three Fiber**.
- **Procedural Generation:** The planet mesh modifies its shader attributes in real-time. We use Fractional Brownian Motion (fBm) 3D Noise functions mathematically evaluated in the render loop to dynamically simulate clouds, terrain, and pollution based on the `PlanetState`.
- **Optimization:** Textures and complex models are asynchronously loaded via `<Suspense>` boundaries. We utilize `drei` helpers (`OrbitControls`, `Stars`) for performant scene management.

---

## ⚙️ 3. Backend Architecture (Node.js Serverless)

### Layered Module Separation
The backend follows Domain-Driven Design principles to separate concerns:

| Layer | Directory | Responsibility |
| --- | --- | --- |
| **Domain Logic** | `src/lib/` | Pure business logic (`carbon-utils.ts`). Calculates exact emission factors, applies gamification math, and computes XP deltas. Free of heavy I/O operations and completely synchronistic. |
| **AI Insights** | `src/services/` | Translates raw input (images, receipts) into structured JSON arrays by chaining Google Cloud Vision OCR results into rigid Gemini Prompts. |
| **Persistence** | `src/services/supabase/` | Supabase bindings. Executes database CRUD operations. If Supabase is offline or disabled, it falls back to an abstract `MockDB` (`src/lib/mock-db.ts`) seamlessly. |
| **Transport / API** | `src/app/api/` | Thin API controllers. Responsible strictly for HTTP parsing, payload validation, MIME type checking, and responding with standard HTTP status codes. |

### Graceful Degradation & Resilience
EcoBuddy AI is designed to never completely "break" if a microservice fails.
1. **AI Failure:** If Gemini API rate limits are hit (HTTP 429), the API route gracefully catches the error and executes a local `heuristicParseOCR` or deterministic mock function to return an approximate result.
2. **Database Offline:** If Supabase connection fails, the client-side global store automatically falls back to utilizing `localStorage` and `MockDB` seed data, allowing the user to experience the App offline or in development environments.
