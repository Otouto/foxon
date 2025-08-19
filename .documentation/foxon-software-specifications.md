# Foxon — Software Requirements Specification (SRS) — MVP (No Analytics/Offline)

> **Scope**: Single **mobile-first PWA** for composing workouts, logging sets, completing a **Session Seal** (Effort + one-line vibe + optional note), and reviewing history (**Sessions / Exercises**).  
> **Explicit MVP exclusions**: **Offline support** (no caching/sync/queue) and **product/crash analytics**. Rely on server/Vercel logs only.

---

## System Design
- **Client**: Next.js (App Router) PWA, installable via Web App Manifest; **network required** for data ops (no SW caching).
- **Server**: Next.js Route Handlers on Vercel (serverless).
- **DB**: Supabase Postgres via Prisma (migrations in repo).
- **Auth**: Clerk OAuth/JWT; server verifies and scopes to `user_id`.
- **Weekly Consistency**: **Vercel Cron** runs daily to evaluate completions vs `weekly_goal`, update `progression_state`, and store a feed cue.
- **Connectivity UX**: If offline is detected, disable write actions and show a “No connection” banner (no local persistence).

---

## Architecture pattern
- **Clean, modular** by feature:
  - **UI** (screens/components)
  - **Application** (hooks/actions, Zod validation, mappers)
  - **Domain** (types/enums, progression rule)
  - **Infrastructure** (API client, Prisma repositories)
- Repository pattern hides data access; shared domain types on client/server.

---

## State management
- **Server state**: **TanStack Query** (queries, mutations, cache, retries, optimistic updates with rollback).
- **Local/UI state**: **Zustand** (composer scratchpad, modal visibility, logging focus).
- **No offline store** in MVP (no IndexedDB/Dexie).

---

## Data flow
1. User action (add exercise/set, complete set) → **Zod** validation.
2. **React Query** mutation → API → Prisma → Postgres.
3. UI uses **optimistic update**; on error, **rollback** + toast (Sonner).
4. **Finish**: server calculates `total_volume` & `total_sets`; **Session Seal** saved via dedicated endpoint.
5. **Review**: client fetches sessions/exercise trends by date range.
6. **Cron job** (daily) updates `progression_state`; reflected on next fetch.

---

## Technical Stack
- **Frontend**: React, **Next.js (App Router)**, Tailwind, **shadcn/ui**, Lucide, Sonner, Zod, TanStack Query, Zustand.
- **PWA**: Web App Manifest only (install prompt); **no SW caching** in MVP.
- **Backend**: Next.js Route Handlers (TypeScript) on Vercel.
- **DB**: Supabase Postgres + **Prisma**.
- **Auth**: **Clerk** (OAuth/JWT).
- **Logging/Monitoring**: Vercel/server logs (no analytics in MVP). _Future_: Sentry + product analytics.

---

## Authentication Process
- User signs in with Clerk OAuth; client includes JWT.
- Server middleware verifies JWT, resolves `user_id`, and scopes queries.
- First login: create `users` row with defaults (`weekly_goal=2`, `progression_state='SLIM'`).
- Logout clears client caches only (no local persistence).

---

## Route Design
- `/` — Dashboard (Fox avatar, weekly cue, reflection snippets).
- `/workout` — routines list.
- `/workout/create` — **Composer** (search/filter, add exercises, configure sets).
- `/workout/[id]/edit` — edit routine.
- `/session/start?workoutId=…` — instantiate session from routine.
- `/session/[id]/log` — active logging view.
- `/session/[id]/finish` — Review Summary → **Session Seal** (modal sub-route).
- `/review/sessions` — calendar + list.
- `/review/exercises` — exercise picker + trends.
- `/profile` — account & preferences.

---

## API Design
_All endpoints require Clerk JWT (resolved to `user_id`)._

**Vocabulary**
- `GET /api/muscle-groups` — list all muscle groups
- `GET /api/equipment` — list all equipment types

**Exercises** _(Global shared vocabulary)_
- `GET /api/exercises?q=&muscle_group_id=&equipment_id=` — list with filters
- `GET /api/exercises/:id` — get exercise details with populated vocabulary

**Workouts (routines)**
- `POST /api/workouts` — `{ title, items:[{ exercise_id, order, sets:[{ type, load, reps, order }] }] }`
- `GET /api/workouts?q=`
- `GET /api/workouts/:id`
- `PATCH /api/workouts/:id`
- `DELETE /api/workouts/:id`

**Sessions**
- `POST /api/sessions` — `{ workout_id }` → returns expanded session
- `POST /api/sessions/:id/sets/batch` — batch operations: `[{ set_id, op:'update|complete|delete|create', payload? }]`
- `POST /api/sessions/:id/finish` — finalize; server computes totals
- `POST /api/sessions/:id/seal` — `{ effort, vibe_line, note? }`

**Review**
- `GET /api/review/sessions?from=&to=`
- `GET /api/review/exercises/:exercise_id?from=&to=`

**User**
- `GET /api/user`
- `PATCH /api/user` — `{ weekly_goal }`
- `GET /api/user/export` — JSON export of user data

**Cron (internal)**
- `POST /api/cron/progression` — key-protected; recomputes weekly `progression_state`

**Validation & Errors**
- Zod validation; `400/422` invalid, `401` unauth, `403` forbidden, `404` not found, `409` conflict.

---

## Database Design ERD

**Core User Management**
**users**
- `id (uuid, pk)`
- `clerk_user_id (text, unique)`
- `display_name (text)`
- `avatar_url (text)`
- `weekly_goal (int, default 2)`
- `progression_state (enum: SLIM|FIT|STRONG|FIERY)`
- `created_at, updated_at`

**Shared Exercise Vocabulary**
**muscle_groups**
- `id (uuid, pk)` • `name (text)` • `description (text|null)`
- `created_at, updated_at`

**equipment**
- `id (uuid, pk)` • `name (text)` • `description (text|null)`
- `created_at, updated_at`

**exercises** _(Global shared vocabulary)_
- `id (uuid, pk)` • `name (text)` • `description (text|null)`
- `muscle_group_id (fk → muscle_groups.id, nullable)` • `equipment_id (fk → equipment.id, nullable)`
- `instructions (text|null)` • `created_at, updated_at`
- **index** `(name)`, `(muscle_group_id)`, `(equipment_id)`

**User Workout Templates**
**workouts**
- `id (uuid, pk)` • `user_id (fk → users.id)` • `title (text)` • `description (text|null)`
- `created_at, updated_at`

**workout_items**
- `id (uuid, pk)` • `workout_id (fk → workouts.id)` • `exercise_id (fk → exercises.id)` 
- `order (int)` • `notes (text|null)`

**workout_item_sets** _(Planned sets in templates)_
- `id (uuid, pk)` • `workout_item_id (fk → workout_items.id)`
- `type (enum: WARMUP|NORMAL)` • `target_load (numeric)` • `target_reps (int)` • `order (int)`
- `notes (text|null)`

**Actual Workout Sessions**
**sessions**
- `id (uuid, pk)` • `user_id (fk → users.id)` • `workout_id (fk → workouts.id, nullable)`
- `date (timestamptz)` • `total_volume (numeric, default 0)` • `total_sets (int, default 0)`
- `status (enum: ACTIVE|FINISHED)` • `created_at, updated_at`

**session_exercises**
- `id (uuid, pk)` • `session_id (fk → sessions.id)` • `exercise_id (fk → exercises.id)` 
- `order (int)` • `notes (text|null)`

**session_sets** _(Actual performed sets)_
- `id (uuid, pk)` • `session_exercise_id (fk → session_exercises.id)`
- `type (enum: WARMUP|NORMAL)` • `load (numeric)` • `reps (int)` • `completed (bool, default false)` 
- `order (int)` • `notes (text|null)`

**session_seals**
- `session_id (pk/fk → sessions.id, unique)` • `effort (enum: EASY|STEADY|HARD|ALL_IN)`
- `vibe_line (text)` • `note (text|null)` • `created_at`

**Constraints & Indexes**
- All FKs `ON DELETE CASCADE`.
- Unique `(workout_item_id, order)` and `(session_exercise_id, order)`.
- Index `sessions(user_id, date)` for range queries.
- Index `exercises(muscle_group_id, equipment_id)` for filtering.
