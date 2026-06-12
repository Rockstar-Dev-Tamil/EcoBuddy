# API Documentation

The backend consists of Next.js Serverless API routes located in `src/app/api/`.

## Endpoints

### `POST /api/chat`
Communicates with Sprig, the AI Sustainability Twin.
- **Request Body:** `{ message: string, history: Array<Message> }`
- **Response:** `{ reply: string, suggestions: Array<string> }`
- **Behavior:** Forwards the conversation context to Gemini Pro and returns structured environmental advice.

### `POST /api/ecosnap`
Analyzes uploaded images (receipts, meals) to determine carbon impact.
- **Request Body:** FormData containing the image file.
- **Response:** `{ items: Array<Item>, estimated_carbon_kg: number, greener_alternatives: Array<string> }`
- **Behavior:** Utilizes Gemini Vision to extract entities from the image, matches them against emission factors, and suggests alternatives.

### `POST /api/entries`
Saves a user's sustainability log snapshot.
- **Request Body:** `{ category: string, description: string, carbon_offset: number }`
- **Response:** `{ success: boolean, new_xp: number, planet_updates: Object }`

### `GET /api/metrics`
Retrieves a user's historical data, XP, streaks, and current Planet state.
- **Response:** `{ profile: Profile, planet: PlanetState, logs: Array<SustainabilityLog> }`
