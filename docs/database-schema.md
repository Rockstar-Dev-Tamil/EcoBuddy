# Supabase Database Schema

EcoBuddy AI uses Supabase (PostgreSQL) as its backend data store. The database schema is designed to store user profile metrics, virtual planet configurations, activity logs, and chat histories securely.

## 1. Profiles Table (`profiles`)

Stores core user progress, gamification metrics (XP, Level), and streak records.

| Column Name | Type | Constraints | Description |
| ----------- | ---- | ----------- | ----------- |
| `id` | `uuid` | `PRIMARY KEY`, references `auth.users` | Unique identifier matching auth tables. |
| `username` | `text` | `NOT NULL`, `UNIQUE` | Selected screen name for the user. |
| `avatar_url`| `text` | | URL pointing to user profile avatar asset. |
| `xp` | `integer`| `DEFAULT 0`, `>= 0` | Total experience points accumulated. |
| `level` | `integer`| `DEFAULT 1`, `>= 1` | Current tier level calculated from XP. |
| `streak_count` | `integer`| `DEFAULT 0`, `>= 0` | Active streak count (daily logging frequency). |
| `green_score` | `integer`| `DEFAULT 50`, `10..100` | Platform Green Score index measuring footprint. |
| `created_at`| `timestamp` | `DEFAULT now()` | Record creation timestamp. |

---

## 2. Planet States Table (`planet_states`)

Tracks physical growth factors mapping to the WebGL 3D virtual planet representation.

| Column Name | Type | Constraints | Description |
| ----------- | ---- | ----------- | ----------- |
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique planet state record identifier. |
| `profile_id` | `uuid` | `references profiles(id)`, `ON DELETE CASCADE` | Owner profile identifier. |
| `vegetation` | `numeric` | `DEFAULT 0.5`, `0.0..1.0` | Vegetation coverage density parameter. |
| `rivers` | `numeric` | `DEFAULT 0.5`, `0.0..1.0` | River and water resources density parameter. |
| `wildlife` | `numeric` | `DEFAULT 0.5`, `0.0..1.0` | Wildlife and biodiversity indicator. |
| `atmosphere_clarity` | `numeric` | `DEFAULT 0.5`, `0.0..1.0` | Cloud and air purity visual parameter. |
| `pollution` | `numeric` | `DEFAULT 0.3`, `0.0..1.0` | Pollution/smog visual particle configuration. |
| `desertification` | `numeric` | `DEFAULT 0.3`, `0.0..1.0` | Desertification and terrain damage factor. |
| `last_updated` | `timestamp` | `DEFAULT now()` | Timestamp of last status recalculation. |

---

## 3. Sustainability Logs Table (`sustainability_logs`)

Stores logs of carbon emissions and green actions submitted by the user.

| Column Name | Type | Constraints | Description |
| ----------- | ---- | ----------- | ----------- |
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique log record identifier. |
| `profile_id` | `uuid` | `references profiles(id)`, `ON DELETE CASCADE` | Profile identifier of logging user. |
| `category` | `text` | `NOT NULL` | Activity sector (e.g., diet, transport, energy). |
| `description` | `text` | `NOT NULL` | Description of the specific logged action. |
| `carbon_offset` | `numeric` | `DEFAULT 0.0` | Carbon avoided/offset by this action in kg. |
| `co2_emission` | `numeric` | `DEFAULT 0.0` | Absolute carbon emitted by this action in kg. |
| `xp_earned` | `integer` | `DEFAULT 0`, `>= 0` | Experience points rewarded by this logging. |
| `created_at` | `timestamp` | `DEFAULT now()` | Action timestamp. |

---

## 4. Chat Messages Table (`chat_messages`)

Stores history logs of conversation threads between users and Sprig, the AI Twin.

| Column Name | Type | Constraints | Description |
| ----------- | ---- | ----------- | ----------- |
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique message identification string. |
| `profile_id` | `uuid` | `references profiles(id)`, `ON DELETE CASCADE` | User owner identification. |
| `sender` | `text` | `CHECK (sender IN ('user', 'ai'))` | Message author type: user or assistant. |
| `message` | `text` | `NOT NULL` | Main raw message contents (sanitized). |
| `created_at` | `timestamp` | `DEFAULT now()` | Creation timestamp. |

---

## 5. Security & Row Level Security (RLS)

All tables strictly enable Postgres Row Level Security (RLS) to enforce data boundaries:
- **Profiles:** Public read access for competitive leaderboards. Update access restricted only to the authenticated user owning that ID.
- **Planet States / Logs / Chats:** Select, Insert, and Update access is strictly restricted to the authenticated user owning the matching `profile_id` field.
