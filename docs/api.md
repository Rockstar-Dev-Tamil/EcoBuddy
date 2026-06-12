# 🔌 API Documentation & Backend Architecture

The EcoBuddy backend relies on Next.js Serverless API routes (under `src/app/api/`) deployed to Vercel. These endpoints act as a middleware layer, orchestrating the interaction between the client (React), the persistence layer (Supabase PostgreSQL), and external AI models (Google Gemini 2.5 Pro & Vision).

## 🛡️ Security & Input Sanitization
All API routes follow strict sanitization protocols:
1. **Payload Size Limits:** `MAX_BASE64_CHARS` (approx. 5MB) limits prevent memory exhaustion.
2. **MIME Type Allowlisting:** File uploads are restricted strictly to safe image types (`image/png`, `image/jpeg`, `image/webp`, `image/gif`).
3. **HTML Sanitization:** Raw text inputs (like chat messages) are stripped of executable scripts (`<script>`, inline HTML) before processing.
4. **Graceful Fallbacks:** If external services (Gemini API) rate-limit (HTTP 429) or return a 503 Service Unavailable, the backend intelligently falls back to offline deterministic mock datasets to ensure the UI remains fully functional.

---

## 📡 REST Endpoints

### 1. `POST /api/chat`
The core conversational engine for Sprig, the AI Sustainability Twin.
- **Description:** Takes the user's latest message and short-term conversation history, constructing a strict prompt for Gemini 2.5 Pro to generate context-aware, actionable sustainability guidance.
- **Request Schema (JSON):**
  ```typescript
  {
    "message": string, // User input (sanitized server-side)
    "history": Array<{ role: "user" | "model", content: string }> // Conversation context
  }
  ```
- **Response Schema (JSON):**
  ```typescript
  {
    "reply": string, // Formatted markdown reply
    "suggestions": Array<string> // 3 follow-up quick actions or prompts
  }
  ```
- **Error States:** Returns `400 Bad Request` if message is missing/malformed. Returns `503 Service Unavailable` on AI quota limits with a client-safe error message.

### 2. `POST /api/ecosnap`
The Gemini Vision processing pipeline for analyzing physical receipts, meal photos, and utility bills.
- **Description:** Receives a base64 encoded image string. Validates the MIME type and payload size. Generates an ephemeral Google Cloud access token via signed JWT assertions (`getGoogleAccessToken`), and invokes Google Cloud Vision for initial OCR and label detection. The extracted text is then passed to Gemini to parse into structured JSON.
- **Request Schema (JSON):**
  ```typescript
  {
    "imageBase64": string, // Data URI format (e.g., "data:image/png;base64,...")
    "filename": string // User-uploaded filename for heuristics
  }
  ```
- **Response Schema (JSON):**
  ```typescript
  {
    "category": "diet" | "energy" | "transport" | "waste" | "shopping" | "water",
    "description": string,
    "co2Emission": number, // Calculated deterministic impact in kg
    "carbonOffset": number, // Offset value based on sustainability score
    "sustainabilityScore": number, // 0-100 score
    "xpEarned": number, // Gamified reward
    "datasetExplain": string, // Data provenance (e.g., "Validated via Open Food Facts")
    "confidence": number, // 0-100 confidence scale
    "alternatives": Array<{ name: string, carbonSaving: number, description: string }>,
    "isMock": boolean,
    "usedGoogleVision": boolean
  }
  ```
- **Pipeline Fallback:** If the API fails, it defaults to `heuristicParseOCR` or local DB rules.

### 3. `POST /api/entries`
Synchronizes the local sustainability snapshots to the remote Supabase PostgreSQL database.
- **Request Schema (JSON):**
  ```typescript
  {
    "category": string,
    "description": string,
    "carbon_offset": number,
    "xp_gained": number
  }
  ```
- **Behavior:** Verifies the user session via Supabase Auth tokens, executes an `INSERT` into the `sustainability_logs` table, and triggers a database RPC to update the user's total XP and streak counts transactionally.
- **Response:** `{ "success": true, "new_xp": 1500, "planet_updates": { ... } }`

### 4. `GET /api/metrics`
Aggregates and retrieves the user's historical footprint, planet progression, and raw logs.
- **Behavior:** Performs a `SELECT` join on the `profiles` table and `sustainability_logs` table. Calculates 7-day trailing emission averages before returning the payload to minimize client-side CPU blocking.
- **Response Schema:** `{ "profile": ProfileObject, "planet": PlanetState, "logs": Array<LogObject> }`
