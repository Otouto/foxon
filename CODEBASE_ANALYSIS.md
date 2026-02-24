# Foxon Codebase Architecture & Testing Roadmap

## Executive Summary

**Foxon** is a Next.js 15 PWA workout tracking application with a sophisticated devotion scoring system. The codebase is well-structured with clear separation of concerns between services (business logic), hooks (state management), API routes (endpoints), and utilities.

**Total Service Layer Code**: ~3,290 lines of TypeScript
**Critical Testing Areas**: 10 services, 16 custom hooks, 15+ API endpoints, 16+ utility functions

---

## 1. SERVICE LAYER ARCHITECTURE (`src/services/`)

### High-Priority Services for Testing

#### 1.1 **DevotionScoringService.ts** (424 lines)
**Purpose**: Core business logic for calculating workout adherence scores

**Key Functions**:
- `computeDevotionScore()` - Main scoring algorithm comparing planned vs actual workout
- `computeDevotionScoreFromData()` - Core math for 4-pillar scoring system
- `calculateExerciseScore()` - Per-exercise scoring (Set Completion, Rep Fidelity, Load Fidelity)
- `updateSessionWithDevotionScore()` - Persist scores to database
- `getGradeColor()` / `getPillarColor()` - UI helpers

**Business Logic Complexity** 🔴 **CRITICAL**:
- 4 devotion pillars: EC (Exercise Coverage), SC (Set Completion), RF (Rep Fidelity), LF (Load Fidelity)
- Geometric mean aggregation formula: `gmean([EC, SC, RF])`
- Bonus system: +5 points for perfect execution with overperformance (capped at 105)
- Grade mapping: Perfect (>100), Dialed in (90-100), On plan (80-90), Loose (70-80), Off plan (<70)
- Deviation ranking and deduplication algorithm
- Handles both loaded and bodyweight exercises differently

**Testing Requirements**:
- Edge cases: perfect execution, missed sets, rep variance, load variance
- Bodyweight exercises (no load fidelity)
- Overperformance bonus calculation
- Deviation detection and ranking
- Built-in test function `runScoringTests()` available

---

#### 1.2 **SessionService.ts** (645 lines)
**Purpose**: Session lifecycle management - creation, updates, completion, deletion

**Key Functions**:
- `createSession()` - Initialize new session from workout template
- `getSession()` - Retrieve session with all details
- `batchUpdateSets()` - Bulk update multiple sets (4 operations: update, complete, create, delete)
- `finishSession()` - Mark session as finished
- `createSessionSeal()` - Post-workout reflection data
- `getUserSessions()` - Paginated session history
- `addSet()` - Add bonus sets during session
- `getPreviousSessionData()` - Retrieve previous performance for exercises
- `deleteSession()` - Cascade delete with transaction
- `getSessionNumber()` - Count sessions by date

**Business Logic Complexity** 🔴 **CRITICAL**:
- Duplicate session prevention (10-second window)
- Transaction-based creation with 30-second timeout
- Session exercise and set hierarchical creation
- Set type handling (WARMUP, NORMAL)
- Set ordering and completion tracking
- Performance history matching by exercise ID

**Database Interactions**:
- Complex `$transaction()` with custom timeouts
- Batch operations for performance
- Cascade relationships: Session → SessionExercise → SessionSet
- JSON serialization for devotion data

**Testing Requirements**:
- Duplicate prevention edge cases
- Transaction rollback scenarios
- Batch operation atomicity
- Set completion state transitions
- Permission/authorization checks (user can only access own sessions)
- Date filtering and ordering

---

#### 1.3 **WorkoutService.ts** (529 lines)
**Purpose**: Workout CRUD operations and template management

**Key Functions**:
- `getUserWorkouts()` - List all user workouts with sorting
- `getWorkoutById()` - Get detailed workout with exercises and sets
- `createWorkout()` / `createDraftWorkout()` - Create active or draft workouts
- `updateWorkout()` - Full workout replacement (deletes and recreates items/sets)
- `deleteWorkout()` - Cascade delete
- `updateWorkoutStatus()` - Change ACTIVE/DRAFT/ARCHIVED status
- `getDraftWorkouts()` - Filter drafts
- `getCategorizedWorkouts()` - Organize by status

**Business Logic**:
- Estimated duration calculation: `totalSets * 3 + (exerciseCount - 1)` minutes
- Exercise and set ordering preservation
- Status-based sorting (ACTIVE → DRAFT → ARCHIVED)
- Full replacement strategy for updates (simplifies logic but has performance implications)

**Testing Requirements**:
- Estimated duration accuracy
- Status transitions and sorting
- Exercise/set hierarchical structure preservation
- Workout-level authorization (only own workouts)
- Delete cascade to workout items and sets

---

#### 1.4 **SessionCompletionService.ts** (96 lines)
**Purpose**: Client-side API calls for session completion workflow

**Key Functions**:
- `saveSession()` - POST to /api/sessions/complete
- `sealSession()` - POST to /api/sessions/{id}/seal
- `completeAndSealSession()` - Combined operation

**Important**: This is a client-side service that wraps API calls. Network error handling included.

**Testing Requirements**:
- Network error recovery
- Response parsing and type checking
- Error message propagation

---

#### 1.5 **ExerciseService.ts** (259 lines)
**Purpose**: Exercise inventory management

**Key Functions**:
- `getAllExercises()` - Sorted by muscle group then name
- `getExerciseById()` - Include muscle group and equipment
- `searchExercises()` - Case-insensitive name/muscle group search (limit 50)
- `createExercise()` - Duplicate name prevention
- `updateExercise()` - Selective field updates

**Business Logic**:
- Case-insensitive duplicate detection
- String trimming for data consistency
- Related entity loading (muscle group, equipment)

---

#### 1.6 **ProfileService.ts** (229 lines)
**Purpose**: User profile and statistics

**Key Functions**:
- `getUserProfile()` - User data + stats
- `calculateUserStats()` - Completed sessions count, week streak
- `calculateWeekStreak()` - Consecutive weeks with sessions
- `getProgressionInfo()` - Map progression state to display info (SLIM → FIT → STRONG → FIERY)
- `updateUserProfile()` - Update displayName, avatarUrl, weeklyGoal

**Business Logic**:
- Week number calculation (handles year boundaries)
- Streak counting logic (skips weeks without sessions)
- Progression level information with emojis

**Testing Requirements**:
- Week streak calculation across year boundaries
- Week number accuracy
- Stats aggregation correctness
- Profile update atomicity

---

#### 1.7 **DashboardService.ts** (204 lines)
**Purpose**: Dashboard data aggregation

**Key Functions**:
- `getDashboardData()` - Fox state, week progress, next workout
- `calculateFoxState()` - Dynamic progression based on completion + devotion

**Business Logic** 🔴 **IMPORTANT**:
- **Fox State Algorithm**:
  - 0 sessions → SLIM (always)
  - Completion threshold: 50% → SLIM, 75% → FIT, 100% → FIERY
  - Devotion modifiers (after 4+ sessions):
    - Avg score ≥90 → promote one level
    - Avg score <80 → demote one level
- **Week Calculation**: Monday-Sunday week with DST consideration
- **Time Window**: Last 8 weeks for state, current week for progress

**Testing Requirements**:
- Fox state promotion/demotion logic
- Week boundary calculations (Monday/Sunday)
- Average devotion score calculation with null handling
- Completion percentage thresholds

---

#### 1.8 **ExerciseAnalyticsService.ts** (457 lines)
**Purpose**: Exercise performance tracking and consistency analysis

**Key Functions**:
- `getCategorizedExerciseAnalytics()` - Split active vs archived exercises
- `getExerciseHistory()` - All sessions for specific exercise
- `calculatePeakPerformance()` - Max (weight × reps) score
- `calculateDevotionDots()` - 12-week activity visualization
- `calculateConsistency()` - Weeks with activity / total available weeks
- `determineChips()` - 'foundation' (≥75%) or 'missing' (<40%)

**Complex Calculations**:
- Week boundary detection (Monday-Sunday, handles year-end)
- Variable-length dot arrays (1-12 weeks) without padding
- Consistency percentage capped at 12 weeks
- Bodyweight exercise detection (weight = 0)

---

#### 1.9 **WorkoutPreloadService.ts** (157 lines)
**Purpose**: Optimization layer for workout data loading

**Key Functions**:
- `preloadWorkoutData()` - Get workout + previous session data with caching
- `preloadMultipleWorkouts()` - Batch loading (batch size: 3 to avoid DB overload)
- Cache management with 5-minute TTL

**Optimization Strategy**:
- Reduces API calls by pre-fetching previous performance data
- In-memory cache with timestamp tracking
- Parallel exercise data loading

---

#### 1.10 **NarrativeService.ts** (293 lines)
**Purpose**: Generate contextual messages for sessions

**Key Functions**:
- `calculateNarrative()` - Generate message based on patterns
- `getNarrativeContext()` - Gather historical data for analysis

**Narrative Logic** (Priority-ordered):
1. Comeback messages (>5 days away)
2. Consistency/rhythm recognition (3+ sessions this week)
3. Workout-specific patterns (first time in 14+ days)
4. Month progress markers (month start, personal best)
5. Encouraging messages (improving scores, consistent practice)

**Testing Requirements**:
- Date arithmetic accuracy
- Pattern detection logic
- Message priority ordering

---

## 2. CUSTOM HOOKS (`src/hooks/`)

### Session Management Hooks

#### 2.1 **useInMemorySession.ts** (404 lines) 🔴 **CRITICAL**
**Purpose**: In-memory session state with localStorage persistence and debouncing

**Key Features**:
- Session initialization from workout or localStorage recovery
- Set/exercise state management (actualLoad, actualReps, completed)
- Navigation between exercises and blocks
- Block-aware navigation (skips exercises in same block)
- Auto-save to localStorage with 1-second debounce
- Timer management (duration calculation)
- Temporary ID generation for new sets

**Complex State Logic**:
- Block navigation (blockId + blockOrder)
- Exercise ordering preservation
- Set completion tracking
- Previous session data injection
- Session recovery from storage

**Testing Requirements**:
- Session recovery from localStorage
- Set update atomicity
- Block navigation logic
- Navigation state persistence
- Debounced save behavior
- Timeout handling

---

#### 2.2 **useSessionCompletion.ts** (91 lines)
**Purpose**: Background session save with reflection (seal) support

**Key Features**:
- `startBackgroundSave()` - Non-blocking session save
- `sealSession()` - Wait for save completion, then seal with reflection
- Promise tracking for async coordination

**Testing Requirements**:
- Promise resolution ordering
- Error propagation
- Reflection data handling

---

#### 2.3 **useSessionData.ts**
**Purpose**: Server-side session data fetching

---

#### 2.4 **useSessionTimer.ts** (Preview shown)
**Purpose**: Simple timer management with start/stop/duration

---

#### 2.5 **useSessionReflection.ts**
**Purpose**: Post-session reflection form state

---

#### 2.6 **useReviewData.ts**
**Purpose**: Session history and grouping for review page

---

#### 2.7 **useSessionInitialization.ts**
**Purpose**: One-time session setup logic

---

#### 2.8 **useWorkoutPreload.ts**
**Purpose**: Preload workout data before session start

---

#### 2.9 **useWorkoutCreation.ts**
**Purpose**: Multi-step workout creation form state

---

#### 2.10 **useSetTracking.ts**
**Purpose**: Individual set state within exercises

---

#### 2.11 Other Hooks: `usePickerOptions`, `useHapticFeedback`, `useSetEditorState`, `useSessionPersistence`, `useSwipeToDelete`

---

## 3. API ROUTES (`src/app/api/`)

### Session Endpoints

#### `POST /api/sessions/complete`
**Purpose**: Save completed session from in-memory state to database
**Implementation**: `/src/app/api/sessions/complete/route.ts` (136 lines)

**Flow**:
1. Parse `CompletedSessionData` from request
2. Create session, session exercises, session sets in transaction
3. Asynchronously calculate devotion score (non-blocking)
4. Return session ID

**Database Operations**:
- Single transaction: 1 session + N exercises + M sets
- 30-second timeout
- Devotion score calculated in background

**Testing Requirements**:
- Data validation (required fields)
- Transaction atomicity
- Score calculation decoupling from response
- Error handling for DB failures

---

#### `GET/POST /api/workouts`
**Purpose**: List and create workouts

**Testing Requirements**:
- Authentication checks
- Pagination for large lists
- Error responses

---

#### `GET /api/workouts/[id]`
**Purpose**: Detailed workout retrieval with exercises and sets

---

#### `PATCH /api/workouts/[id]`
**Purpose**: Update workout status (ACTIVE/DRAFT/ARCHIVED)

---

#### `GET /api/workouts/[id]/preload`
**Purpose**: Preload workout with previous session data

---

#### `POST /api/sessions/[id]/seal`
**Purpose**: Create session reflection/seal

---

#### `DELETE /api/sessions/[id]/delete`
**Purpose**: Delete session (cascade)

---

#### Other routes: `/api/exercises`, `/api/exercises/[id]`, `/api/muscle-groups`, `/api/equipment`, `/api/profile`

---

## 4. UTILITY FUNCTIONS (`src/lib/utils/`)

### 4.1 **devotionUtils.ts** (90 lines)
**Purpose**: Devotion score display formatting

**Functions**:
- `formatDevotionScore()` - "95", "100", "100+"
- `formatDevotionScoreWithMax()` - "95/100", "100/100", "100+"
- `getDevotionGlowClass()` - CSS class for glow effect based on score
- `isPerfectScore()` - Boolean check (>100)
- `formatDevotionGrade()` - Format grade with optional emoji

**Testing Requirements**:
- Null/undefined handling
- Score capping behavior
- CSS class consistency

---

### 4.2 **exerciseUtils.ts** (35 lines)
**Purpose**: Bodyweight exercise detection

**Functions**:
- `isBodyweightExercise()` - Check equipment for bodyweight indicators
- `hasBodyweightSets()` - Check if all sets have 0 weight

**Languages Supported**:
- English: "bodyweight"
- Ukrainian: "власна вага", "власна"

---

### 4.3 **sessionPatterns.ts** (132 lines)
**Purpose**: Session connection analysis for review visualization

**Functions**:
- `calculateRestDays()` - Days between sessions
- `isStrengthWorkout()` - Check if workout is strength-focused
- `shouldShowConnectors()` - Show connectors if ≥2 strength workouts
- `calculateProportionalVisuals()` - Visual state and height based on rest days
- `analyzeSessionConnection()` - Full connection analysis
- `getSessionConnections()` - Get all connections for session group

**Complex Logic**:
- Rest day calculation (excluding both session days)
- Visual state mapping: connected (0 days), dots (1-7 days), compressed (8-14 days), extended (>14 days)
- Height scaling: `30 + (restDays * 14)` for dots visualization

---

### 4.4 **dateUtils.ts**
**Purpose**: Date manipulation utilities

---

### 4.5 **mediaUtils.ts**
**Purpose**: Image/media handling

---

### 4.6 **headerIntelligence.ts**
**Purpose**: Smart header generation

---

## 5. TYPE DEFINITIONS (`src/lib/types/`)

### 5.1 **workout.ts**
**Key Types**:
- `WorkoutDetails` - Full workout with exercises and sets
- `WorkoutListItem` - Summary for lists
- `WorkoutItem` - Exercise + sets within workout
- `CreateWorkoutRequest` / `UpdateWorkoutRequest` - API schemas
- `CategorizedWorkouts` - Organized by status
- `WorkoutSet` - Set data (type, load, reps, order)

---

### 5.2 **exercise.ts**
**Key Types**:
- `Exercise` - Full exercise details
- `ExerciseListItem` - Summary for selection

---

## 6. CORE UTILITIES

### 6.1 **SessionStorageManager.ts** (5.3 KB)
**Purpose**: Abstract localStorage access with session-specific keys

---

### 6.2 **debouncedStorage.ts** (5.8 KB)
**Purpose**: Debounced localStorage writes with batch flushing

**Key Feature**: Prevents excessive writes during rapid state updates

---

### 6.3 **auth.ts** (900 bytes)
**Purpose**: Mock authentication (no real auth implemented)

**Current Implementation**:
- `getCurrentUserId()` - Returns mock user ID
- `isAuthenticated()` - Always returns true
- `getCurrentUser()` - Returns mock user object

**Note**: Ready for Clerk integration

---

### 6.4 **prisma.ts**
**Purpose**: Prisma client singleton

---

## 7. CRITICAL BUSINESS LOGIC SUMMARY

### 7.1 Devotion Scoring System
```
Formula: CDS = gmean([EC, SC, RF]) × 100

Where:
- EC = exercises completed / total exercises
- SC = sets completed / total planned sets (soft cap at +2%)
- RF = rep fidelity (penalize under-performance only)
- LF = load fidelity (not included in final CDS)

Bonus:
- Perfect execution (SC=1.0 AND RF=1.0 AND EC=1.0) + overperformance = +5 points (max 105)
```

### 7.2 Fox Progression States
```
Based on 8-week rolling window:

- SLIM: 0-50% of goal
- FIT: 50-75% of goal
- STRONG: 75-100% of goal
- FIERY: ≥100% of goal

With devotion modifiers (≥4 sessions required):
- Avg score ≥90: promote one level
- Avg score <80: demote one level
```

### 7.3 Session State Management
- **Active**: Currently in progress
- **Finished**: Completed (not sealed)
- **Sealed**: Completed + reflection recorded

### 7.4 Workout Statuses
- **ACTIVE**: Available for sessions
- **DRAFT**: Under development
- **ARCHIVED**: No longer used

---

## 8. RECOMMENDED TESTING PRIORITIES

### 🔴 CRITICAL (High Business Impact)
1. **DevotionScoringService**
   - All pillar calculations
   - Grade assignment logic
   - Bonus system
   - Edge cases (bodyweight, missed sets, overperformance)

2. **SessionService**
   - Duplicate prevention
   - Transaction rollback
   - Cascade delete
   - Authorization checks

3. **useInMemorySession**
   - State recovery from localStorage
   - Block navigation logic
   - Debounced persistence
   - Set management

4. **DashboardService**
   - Fox state calculation
   - Week streak logic
   - Progression modifiers
   - Time window boundaries

### 🟡 MEDIUM (Core Features)
1. **WorkoutService** - CRUD operations
2. **ExerciseAnalyticsService** - Consistency/devotion dot calculations
3. **SessionCompletionService** - API error handling
4. **NarrativeService** - Message generation logic

### 🟢 LOW (Infrastructure)
1. **ExerciseService** - Basic CRUD
2. **ProfileService** - Data retrieval
3. **WorkoutPreloadService** - Caching logic
4. **Utility functions** - Formatting and helpers

---

## 9. TESTING INFRASTRUCTURE NOTES

### Current Status
- **Test Runner**: None configured (manual testing recommended)
- **Prisma Studio**: Available for database inspection
- **Mock Authentication**: Fully implemented for testing
- **Seed Data**: Available in `/src/lib/seedData.ts`

### Built-in Testing
- **DevotionScoringService.runScoringTests()** - Self-contained scoring tests

### Database Testing
- Prisma transactions for atomicity
- Custom timeout management (10-30 seconds)
- Cascade delete relationships configured

---

## 10. KEY FILES SUMMARY

| File | Lines | Purpose | Complexity |
|------|-------|---------|------------|
| DevotionScoringService.ts | 424 | Scoring algorithm | 🔴 Critical |
| SessionService.ts | 645 | Session lifecycle | 🔴 Critical |
| useInMemorySession.ts | 404 | Client state mgmt | 🔴 Critical |
| WorkoutService.ts | 529 | Workout CRUD | 🟡 Medium |
| ExerciseAnalyticsService.ts | 457 | Analytics | 🟡 Medium |
| DashboardService.ts | 204 | Aggregation | 🟡 Medium |
| ProfileService.ts | 229 | User profile | 🟡 Medium |
| SessionCompletionService.ts | 96 | API wrapper | 🟡 Medium |
| ExerciseService.ts | 259 | Exercise mgmt | 🟢 Low |
| WorkoutPreloadService.ts | 157 | Caching | 🟢 Low |
| NarrativeService.ts | 293 | Messaging | 🟡 Medium |
| devotionUtils.ts | 90 | Formatting | 🟢 Low |
| sessionPatterns.ts | 132 | Visualization | 🟡 Medium |
| **TOTAL** | **~3,290** | - | - |

---

## 11. ARCHITECTURE PATTERNS

### Service Layer Pattern
- Static methods for pure business logic
- Dependency injection through parameters
- Error handling with console.error logs
- Async/await for database operations
- Transaction support for atomic operations

### Hook Patterns
- `useCallback` for memoized functions
- `useRef` for persistent values across renders
- `useState` for component state
- Cleanup in `useEffect` dependencies

### Database Patterns
- Prisma ORM exclusively (no raw SQL)
- Batch operations for performance
- Transaction with custom timeouts
- Proper include/select for query optimization
- Cascade deletes configured in schema

### Authorization
- User ID checks on all service functions
- findFirst with userId filters
- No cross-user data exposure

---

## 12. KNOWN LIMITATIONS & CONSIDERATIONS

1. **Auth System**: Mock auth only - ready for Clerk integration
2. **Devotion Score Calculation**: Async, non-blocking (may have race conditions with rapid updates)
3. **Workout Updates**: Full replace strategy (deletes all items/sets) - less efficient than incremental
4. **Cache Duration**: 5-minute TTL may be insufficient for frequently-updated workouts
5. **Session Persistence**: Debounced to localStorage - potential data loss on app crash
6. **Week Calculation**: Custom logic rather than standard library (potential edge cases)

