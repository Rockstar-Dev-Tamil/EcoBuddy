# EcoBuddy Deployment Guide

This document details the configuration and deployment process for the EcoBuddy AI platform. The system is designed to compile as a standard Next.js application and deploy seamlessly to Vercel, integrated with Supabase and Google Gemini.

## 1. Prerequisites & External Accounts

Before deploying, ensure you have set up accounts on:
1. **GitHub:** For hosting the repository and executing CI/CD pipelines.
2. **Vercel:** For hosting the Next.js frontend compilation.
3. **Supabase:** For the serverless PostgreSQL database and authentication.
4. **Google AI Studio:** For retrieving the `GEMINI_API_KEY` (Gemini 2.5 Engine).

---

## 2. Environment Variables Configuration

The platform requires both public (client-side) and private (server-side) environment variables.

Create a `.env.local` file in the root directory for local development:

```env
# ─── Supabase Configuration (Public) ──────────────────────────────────
# Retrieve these from Supabase Project Settings -> API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key

# ─── Gemini Engine Configuration (Private) ─────────────────────────────
# Retrieve from Google AI Studio (https://aistudio.google.com/)
GEMINI_API_KEY=your-gemini-api-key

# ─── Google Vision service account (Private, optional fallback) ─────────
# JSON credential string from Google Cloud Platform Console for Cloud Vision API
GOOGLE_SERVICE_ACCOUNT_JSON={"type": "service_account", "project_id": ...}
```

> [!WARNING]
> Never commit `.env.local` to public repositories. This file is added to `.gitignore`.

---

## 3. Database Initial Setup (Supabase)

To prepare your Supabase instance:
1. Create a new project in the Supabase Dashboard.
2. Navigate to the **SQL Editor** tab.
3. Copy the contents of the root `schema.sql` file and paste it into the editor.
4. Run the query to create all tables (`profiles`, `planet_states`, `sustainability_logs`, `chat_messages`), setup indexes, and enable Row Level Security (RLS) rules.

---

## 4. Deploying to Vercel

### Step-by-step setup:
1. Connect your Vercel account to your GitHub repository.
2. Click **New Project** and import the `EcoBuddy` repository.
3. In the **Environment Variables** configuration section, input the following variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
4. Click **Deploy**. Vercel will compile the Next.js routes, evaluate type checks, and deploy the application.

---

## 5. Offline Sandbox Sandbox Fallback Mode

If no environment variables are provided during build/runtime, EcoBuddy AI automatically runs in **Offline Sandbox Mode**.
- Client data is safely stored in the browser's `localStorage` (via the `MockDB` client helper).
- Gemini API routes fallback to predefined mock response templates reflecting logged categories.
- Screen layouts remain fully inspectable and navigable, making it safe for hackathon evaluations.
