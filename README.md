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
| **Track** | Save sustainability logs over time to your **Personalized 3D Planet**. Positive actions grow vegetation, while unsustainable behaviors lead to pollution and desertification. |
| **Reduce** | Chat with **Sprig**, your plant-inspired AI companion, to receive context-aware, personalized recommendations for food, transport, and energy. |

---

## 2. Approach & logic

### The decision flow (smart, context-driven assistant)

```text
User inputs (logs, text chat, receipt/meal photos)
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
