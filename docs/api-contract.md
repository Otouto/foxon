# Foxon API Contract

The HTTP contract between the Foxon backend (Next.js API routes on Vercel) and its clients
(web app, native iOS app, future Apple Watch app). All business logic lives in `src/services/*`;
routes are thin wrappers.

## Conventions

- **Base URL**: the deployed Vercel app (e.g. `https://<app>.vercel.app`). Local dev: `http://localhost:3000`.
- **Auth**: Clerk. Browser clients use session cookies; native clients send
  `Authorization: Bearer <clerk-session-token>` (obtained via `getToken()` from the Clerk SDK,
  fetched per request — tokens are short-lived). Unauthenticated API requests receive `401 {"error":"Unauthorized"}` (JSON, no redirect — see `src/middleware.ts`).
- **User scoping**: the backend resolves Clerk user → internal `User.id` (`src/lib/auth.ts:getCurrentUserId`),
  auto-creating the `User` row on first request. Clients never send user ids.
- **Errors**: non-2xx responses carry `{ "error": string }` (sometimes `details`).
- **Types**: request/response shapes reference `src/lib/types/workout.ts`, `exercise.ts`, `chronicle.ts`
  and Prisma enums in `prisma/schema.prisma` (`SetType`, `EffortLevel`, `WorkoutStatus`, `SessionStatus`, `ProgressionState`).
- **Public (unauthenticated) routes**: `/api/cron/*` only (guarded by `CRON_SECRET` bearer instead).

## Dashboard & profile

| Method | Path | Notes |
|---|---|---|
| GET | `/api/dashboard` | `DashboardService.getDashboardData()` → `{ displayName, foxState: { state: ProgressionState, formScore, formScoreBreakdown }, weekProgress: { completed, planned, isComplete, isExceeded, extra }, lastSession }`. Added for mobile (web renders this server-side). |
| GET | `/api/week-progress` | `{ completed, planned, isComplete, isExceeded, extra }` |
| GET | `/api/profile` | `ProfileService.getUserProfile()` → `{ user: { displayName, email, weeklyGoal, foxLevel, foxFormScore }, stats: { completedSessions, currentWeekStreak }, firstSessionDate, trainingPulse: { grid, totalSessions, weekStreak }, chronicleEntry }`. Added for mobile. |
| PATCH | `/api/profile` | Body: `{ weeklyGoal?: 1..7, email?: string \| null }` → `{ success, weeklyGoal, email }`. 400 on validation failure. |

## Workouts

| Method | Path | Notes |
|---|---|---|
| GET | `/api/workouts` | `{ success, workouts: WorkoutListItem[] }` — user's workouts, all statuses. |
| POST | `/api/workouts` | Body: `CreateWorkoutRequest` (`{ title, description?, items: [{ exerciseId, order, notes?, blockId?, blockOrder?, sets: [{ type, targetLoad, targetReps, order, notes? }] }] }`) → `{ success, workout }` (status ACTIVE). |
| POST | `/api/workouts/draft` | Same body; creates with status DRAFT. 400 if no title/items. → `{ workout }` |
| GET | `/api/workouts/[id]` | → `WorkoutDetails` (workout + items + exercises + target sets). 404 if not found. |
| PUT | `/api/workouts/[id]?status=DRAFT\|ACTIVE` | Body: `UpdateWorkoutRequest`. Updates content then sets status (default ACTIVE). → updated `WorkoutDetails`. |
| PATCH | `/api/workouts/[id]` | Body: `{ status: 'ACTIVE' \| 'DRAFT' \| 'ARCHIVED' }` → `{ message, status }`. |
| DELETE | `/api/workouts/[id]` | → `{ message }`. 404 if missing. |
| GET | `/api/workouts/[id]/preload` | → `{ success, preloadedData: { workout: WorkoutDetails, previousSessionData: Record<exerciseId, { load, reps }[]>, lastSessionDate } }`. Used to start a session with previous-set hints. |
| POST | `/api/workouts/preload` | Body: `{ workoutIds: string[] }` → same shape keyed by workoutId. Batch warm-up for the workout list. |

## Exercises & vocabulary

| Method | Path | Notes |
|---|---|---|
| GET | `/api/exercises?q=` | `{ exercises: Exercise[] }`; `q` switches to name search. |
| POST | `/api/exercises` | Body: `{ name, muscleGroupId?, equipmentId?, instructions?, imageUrl? }` → 201 `{ exercise }`. 409 if name exists. |
| GET | `/api/exercises/[id]` | `{ exercise }` with muscleGroup/equipment relations. 404 if missing. |
| PUT | `/api/exercises/[id]` | Partial exercise fields → `{ exercise }`. |
| GET | `/api/muscle-groups` | `{ muscleGroups: [{ id, name, description }] }` |
| GET | `/api/equipment` | `{ equipment: [{ id, name, description }] }` |

## Sessions

| Method | Path | Notes |
|---|---|---|
| POST | `/api/sessions/complete` | Body: `{ sessionData: { workoutId, workoutTitle, startTime, endTime, duration (sec), exercises: [{ exerciseId, exerciseName, order, notes?, sets: [{ type: SetType, load, reps, completed, order, notes? }] }] } }` → `{ success, sessionId, message }`. Creates FINISHED session transactionally; devotion scoring + fox-level evaluation run **async in the background** — clients must poll the GET below for the score. |
| GET | `/api/sessions/[id]` | → session with details incl. `devotionScore` (null until background scoring completes), `devotionGrade`, `devotionPillars`, `devotionDeviations`. Poll with backoff after completing. |
| POST | `/api/sessions/[id]/seal` | Body: `{ effort: EffortLevel, vibeLine: string, note? }`. Upserts post-workout reflection. 404 unless session is FINISHED and owned. |
| POST | `/api/sessions/[id]/photo` | Body: `{ imageUrl }` (client uploads to Cloudinary first, unsigned preset — see `src/lib/utils/cloudinaryUpload.ts`). Upserts one photo per session. |
| DELETE | `/api/sessions/[id]/photo` | Removes the photo record. |
| DELETE | `/api/sessions/[id]/delete` | Hard-deletes the session. → `{ success }` |
| GET | `/api/sessions/review?tab=sessions` | `{ sessions: SessionReviewData[], weeklyGoal }` — all FINISHED sessions desc, each with devotion score/grade, seal fields, computed narrative. |
| GET | `/api/sessions/review?tab=exercises` | Categorized exercise analytics (`ExerciseAnalyticsService.getCategorizedExerciseAnalytics()`). |

## Chronicle (monthly AI narrative)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/chronicle` | List of the user's chronicles (id, month, year, chapterNumber, title, contentMd/Html, emailSentAt, ...). |
| GET | `/api/chronicle/[id]` | Single chronicle. 404 if not owned. |
| POST | `/api/chronicle/[id]` | Sends the chronicle email. → `{ ok }` |
| DELETE | `/api/chronicle/[id]` | Deletes. → `{ ok }` |
| POST | `/api/chronicle/generate` | Body: `{ month: 1..12, year, sendEmail?: boolean }`. Generates via Anthropic API and stores. Slow (LLM call) — client should show progress state. |
| POST | `/api/chronicle/send-test` | Dev utility; generates a fixed test chronicle and emails it. |
| GET | `/api/cron/chronicle` | Vercel cron only (`Authorization: Bearer ${CRON_SECRET}`). Not for app clients. |

## Notes for native clients

- **Offline model**: the active workout session is fully client-side; no API calls between
  session start (preload) and `POST /api/sessions/complete`. Persist locally and submit once at the end.
- **Devotion score polling**: after `complete`, poll `GET /api/sessions/[id]` with exponential backoff
  (web uses max ~8 retries) until `devotionScore !== null`.
- **Image upload**: direct unsigned upload to Cloudinary (`https://api.cloudinary.com/v1_1/<cloud>/image/upload`,
  form fields `file`, `upload_preset`) then pass the returned `secure_url` to the API.
- **Watch (future)**: the Watch app should not call this API directly in v1; it syncs the in-memory
  session to the iPhone app via WatchConnectivity, and the phone remains the single writer.
