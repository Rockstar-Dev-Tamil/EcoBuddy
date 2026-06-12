# 🗺️ Next.js Route Architecture & Component Trees

EcoBuddy AI leverages the **Next.js App Router (`src/app/`)**, fully embracing Server Components (RSC) and Client Components (`"use client"`) to optimize bundle sizes and layout shifts.

---

## 📂 Core Layout & Boundaries

### The Root Layout (`src/app/layout.tsx`)
The absolute wrapper for the application.
- Loads global **CSS** and custom font configurations (Geist Sans & Geist Mono).
- Injects critical SEO metadata (`metadata` object) and responsive viewport definitions.
- Wraps all children in the global `ThemeProvider` or `GameStoreProvider`.

### Global Error & Loading Boundaries
- **`src/app/loading.tsx`:** An automatic Suspense boundary. While a route segment is dynamically loading or fetching server-side data, this displays the `LeafLoader` component.
- **`src/app/error.tsx`:** A React Error Boundary that catches runtime errors inside route segments. Provides a fallback UI with a `reset()` function to attempt recovery without reloading the entire window.

---

## 🛣️ Page Hierarchy & Routing Strategy

### 1. `/` (Landing Page)
- **File:** `src/app/page.tsx`
- **Purpose:** High-conversion landing view introducing EcoBuddy AI.
- **Technical Details:** Highly statically optimized. Imports heavy animation libraries dynamically via `next/dynamic` to keep initial Time-To-Interactive (TTI) low.

### 2. `/dashboard` (The Command Center)
- **File:** `src/app/dashboard/page.tsx`
- **Purpose:** The user's primary hub. Displays real-time states.
- **Component Tree:**
  - `<SidebarNavigation />`
  - `<PlanetViewer />` (Heavy WebGL context)
  - `<WeeklyEmissionsWidget />` (Data fetched from local store)
  - `<DailyChallenges />`

### 3. `/carbon-tracker` (Analytics Hub)
- **File:** `src/app/carbon-tracker/page.tsx`
- **Purpose:** Deep dive into 6-category emission monitoring.
- **Technical Details:** 
  - Mounts `<CarbonCalculator />` allowing complex state input.
  - Replaces standard charts with `<PremiumAnalyticsWidget />`, an Apple Health-inspired glassmorphism dashboard.
  - Dynamically loads `Recharts` (`<RadialBarChart>`) for rendering animated, concentric category rings on the client side to avoid hydration mismatches.
  - Computes exact footprint equivalencies (e.g., number of trees needed to offset emissions) using pure mathematical helper functions.

### 4. `/simulator` (Earth 2050 Temporal Engine)
- **File:** `src/app/simulator/page.tsx`
- **Purpose:** Compares Business-As-Usual vs Sustainable trajectories.
- **Technical Details:** Manipulates the `cloudSpeedMultiplier` and `pollution` shader uniforms on the `PlanetViewer` dynamically based on a client-side slider state.

### 5. `/twin` (Sprig Conversation Interface)
- **File:** `src/app/twin/page.tsx`
- **Purpose:** AI chat interface.
- **Technical Details:** Manages a continuous array of `Message` objects. Implements a debounced `POST /api/chat` request queue to prevent double-firing API calls during rapid user input. Includes auto-scroll-to-bottom mechanics via `useRef`.

### 6. `/ecosnap` (Vision Upload Tool)
- **File:** `src/app/ecosnap/page.tsx`
- **Technical Details:** Interfaces directly with the browser's `<input type="file" />` and Camera APIs. Executes client-side image compression (scaling down via an offscreen `<canvas>`) before converting to Base64 to strictly adhere to the `MAX_BASE64_CHARS` limit prior to hitting the API route.
