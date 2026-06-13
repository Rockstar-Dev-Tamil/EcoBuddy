# 🌱 EcoBuddy AI — AI-Powered Carbon Footprint Awareness Platform

[![CI](https://github.com/your-username/ecobuddy/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/ecobuddy/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> ### **See the future you're creating — and build a greener one.**
>
> EcoBuddy AI is an intelligent sustainability companion that helps individuals **understand, track, and reduce** their personal carbon footprint through AI-powered insights, computer vision, gamification, and immersive visualizations.

Built as a single, highly accessible web application utilizing **Google Gemini 2.5 Pro + Gemini Vision**, a **Supabase (PostgreSQL)** backend, and a **Next.js (React + TypeScript)** frontend. EcoBuddy AI transforms sustainability from dry statistics into an emotionally engaging journey.

## 🔗 Live demo

**<https://ecobuddy-ai.vercel.app>** *(Placeholder Link)*

---

## 🌍 Why EcoBuddy AI?

Climate awareness tools often overwhelm users with charts and numbers but fail to inspire long-term change. EcoBuddy AI focuses on:

* 🌿 Understanding environmental impact.
* 📈 Tracking sustainability habits over time.
* 🎯 Encouraging positive behavior through gamification.
* 🤖 Delivering personalized AI recommendations.
* 🌎 Helping users visualize the future they are creating.

---

## ✨ Product Features

### 🌿 Sprig — AI Sustainability Twin
Sprig is a plant-inspired AI companion powered by **Google Gemini 2.5 Pro**. Instead of presenting complicated statistics, Sprig communicates naturally, helping users understand daily habits, identify high-impact behaviors, and suggesting sustainable alternatives.

### 📸 EcoSnap AI
Powered by **Gemini Vision**, EcoSnap allows users to upload meal photos, grocery receipts, utility bills, or product labels. It automatically detects objects, estimates environmental impact, generates sustainability scores, and suggests greener alternatives.

### 🌎 Earth 2050 Simulator
The Earth 2050 Simulator visualizes how today's choices affect tomorrow's world. Users can toggle a timeline to compare the Business-as-Usual Path (current habits continue) versus a Sustainable Path (eco-friendly decisions adopted).

### 🪐 Personalized Living Planet
Every user owns a unique virtual 3D ecosystem (built with React Three Fiber). Positive actions grow forests, clear the air, and promote biodiversity. Unsustainable behavior dynamically causes pollution, smog, and desertification based on the user's sustainability score.

### 📊 Carbon Emission Tracker
Track emissions across 6 core categories (Food, Transportation, Electricity, Shopping, Water, Waste) using a production-grade tracking interface. Features a premium, Apple Health-inspired glassmorphism widget with animated Recharts concentric rings, real-world metric equivalencies (like trees required to offset), and Framer Motion micro-interactions.

### 🏆 Gamification System
Footprint awareness is useless if users don't return. EcoBuddy leverages an XP system, levels, daily challenges, and streaks to reward users for building sustainable habits.

---

## 🏗 Architecture & Technology Stack

```text
Browser (Next.js + React + Three.js)
                │
                ▼
Next.js API Routes (Serverless Functions)
                │
       ┌────────┴────────┐
       ▼                 ▼
Google Gemini        Supabase
(Pro + Vision)       Auth + PostgreSQL
       │                 │
       └────────┬────────┘
                ▼
      Planet State + Challenges
```

### Stack Details
* **Frontend:** Next.js 15, TypeScript, Tailwind CSS, Framer Motion, React Three Fiber.
* **Backend:** Supabase (PostgreSQL + Auth), Next.js Serverless API Routes.
* **AI Engine:** Google Gemini 2.5 Pro & Gemini Vision.
* **Deployment:** Vercel.

---

## 🛠️ Local Installation & Usage

Follow these steps to run EcoBuddy AI locally:

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory and configure the following variables:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key

# Gemini API Configuration
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🛡️ Code Quality & Validation

EcoBuddy AI is engineered to be highly readable, maintainable, and resilient to bugs. 
* **Clean Code:** Core business logic is isolated into pure utility functions, while UI components remain highly modular.
* **Continuous Integration:** Every push to `main` must pass a rigorous GitHub Actions pipeline featuring **95+ Vitest unit/integration tests**, strict `tsc` type-checking, aggressive ESLint linting, and a successful production build.

> **Read more about our engineering standards in [docs/code-quality.md](docs/code-quality.md).**

---

## 📚 Deep-Dive Documentation

For engineers and contributors, every technical system inside EcoBuddy AI is thoroughly documented. Explore our architecture, data schemas, and API limits below:

* 🗺️ **[Next.js Route Architecture (docs/routes.md)](docs/routes.md):** Deep dive into our Server Component (RSC) vs Client boundaries, dynamic suspense loaders, and exhaustive component trees for the Dashboard, Simulator, and EcoSnap layouts.
* 🏗️ **[Backend & Data Architecture (docs/architecture.md)](docs/architecture.md):** Learn about our Zustand global store optimizations, React Three Fiber render loops, modular Domain-Driven Design (DDD), and seamless fallback logic when Supabase is offline.
* 🔌 **[API Documentation (docs/api.md)](docs/api.md):** Complete schemas for every serverless endpoint. Read exactly how we invoke the Gemini Vision API, execute JSON parsing, securely sanitize user inputs, and process multipart form uploads.
* 🛡️ **[Code Quality & Validation (docs/code-quality.md)](docs/code-quality.md):** Discover how we maintain a pristine codebase using aggressive ESLint rules, 100% strict TypeScript, and an 80+ test Vitest integration suite via GitHub Actions CI/CD.
* 🗄️ **[Database Schema (docs/database-schema.md)](docs/database-schema.md):** Learn about our Supabase tables, row-level security (RLS), constraints, and triggers.
* 🚀 **[Deployment (docs/deployment.md)](docs/deployment.md):** Instructions for hosting, environment variable sets, database sql setups, and offline previews.
* 🧪 **[Testing Framework (docs/testing.md)](docs/testing.md):** Learn about our unit, integration, E2E browser tests, and test-coverage parameters.
* ♿ **[Accessibility Standards (docs/accessibility.md)](docs/accessibility.md):** Detailed audits on ARIA accessibility labels, landmarks, and color contrast.
* 🔒 **[Security Architecture (docs/security.md)](docs/security.md):** Audit details on DOMPurify input sanitizations, rate-limiting bucket sizes, and HTTPS headers.

---

## 🚀 Future Additions

EcoBuddy AI is designed to evolve into a complete AI-powered sustainability ecosystem. Planned improvements include:

* **🌤 Real-Time Environmental Intelligence:** Local weather awareness, seasonal suggestions, and air quality insights.
* **🎙 Voice Companion:** Interact with Sprig using natural voice responses and hands-free coaching.
* **🧠 Long-Term Memory:** Sprig will remember favorite meals, travel habits, and past achievements for deep context.
* **🌱 Companion Evolution System:** Sprig will visually evolve from a Seed 🌱 to a Forest Guardian 🌲.
* **🪐 Advanced Planet Ecosystem:** Dynamic weather, day/night cycles, aurora effects, and wildlife simulations.
* **📷 Barcode Scanner & Food Database:** Ingredient-level analysis and packaging recognition.
* **🏡 Smart Home Integration:** Sync with smart meters for automated electricity monitoring.
* **👥 Community Expansion & Events:** Group challenges, leaderboards, and seasonal events (e.g., Plastic-Free Week).
* **📱 Progressive Web App (PWA):** Offline access, installable mobile experience, and push notifications.

---

## 🌱 Long-Term Vision

By combining the intelligence of Google Gemini with visualization and gamification, EcoBuddy AI seeks to help millions of people make better choices and collectively build a collectively greener future.

> **"See the future you're creating — and take action to build a greener one."**

