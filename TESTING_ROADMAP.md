# Foxon Testing Roadmap

This document provides a structured approach to testing the Foxon codebase, based on the comprehensive architecture analysis in `CODEBASE_ANALYSIS.md`.

## Quick Navigation

- **Full Analysis**: See `CODEBASE_ANALYSIS.md` for comprehensive documentation
- **Service Layer**: See section 1 of `CODEBASE_ANALYSIS.md` 
- **Custom Hooks**: See section 2 of `CODEBASE_ANALYSIS.md`
- **API Routes**: See section 3 of `CODEBASE_ANALYSIS.md`
- **Testing Priorities**: See section 8 of `CODEBASE_ANALYSIS.md`

## Test Structure Recommendations

### Phase 1: Unit Tests (Critical Services)

**Duration**: 2-3 weeks
**Focus**: Isolated business logic with mocks

```
tests/
├── services/
│   ├── DevotionScoringService.test.ts      (Priority 1)
│   ├── SessionService.test.ts              (Priority 1)
│   ├── DashboardService.test.ts            (Priority 1)
│   ├── WorkoutService.test.ts              (Priority 2)
│   ├── ExerciseAnalyticsService.test.ts    (Priority 2)
│   └── ...
├── hooks/
│   ├── useInMemorySession.test.ts          (Priority 1)
│   ├── useSessionCompletion.test.ts        (Priority 2)
│   └── ...
└── utils/
    ├── devotionUtils.test.ts               (Priority 3)
    ├── sessionPatterns.test.ts             (Priority 3)
    └── exerciseUtils.test.ts               (Priority 3)
```

### Phase 2: Integration Tests (Service + Database)

**Duration**: 2-3 weeks
**Focus**: Prisma transactions, cascade operations, data consistency

```
tests/integration/
├── sessions/
│   ├── session-creation.test.ts            (Critical)
│   ├── session-completion.test.ts          (Critical)
│   ├── duplicate-prevention.test.ts        (Critical)
│   └── cascade-delete.test.ts              (Critical)
├── workouts/
│   ├── workout-crud.test.ts
│   └── status-transitions.test.ts
└── scoring/
    ├── devotion-calculation.test.ts
    └── fox-state-progression.test.ts
```

### Phase 3: E2E Tests (Full User Flows)

**Duration**: 2-3 weeks
**Focus**: Complete workflows with UI

```
tests/e2e/
├── session-workflow.test.ts
│   ├── Create session
│   ├── Update sets (individual and batch)
│   ├── Complete session
│   ├── Seal with reflection
│   └── Verify devotion score
├── workout-management.test.ts
├── profile-progression.test.ts
└── analytics-accuracy.test.ts
```

---

## Testing Priorities by Component

### 🔴 CRITICAL (Must Test First)

#### 1. DevotionScoringService

**Test Cases**:
```typescript
// Pillar calculations
- Perfect execution (100/100)
- Missed sets (SC < 1.0)
- Rep variance (RF < 1.0)
- Load variance (LF < 1.0)
- Mixed scenarios

// Grade assignment
- Off plan (<70)
- Loose (70-80)
- On plan (80-90)
- Dialed in (90-100)
- Perfect (>100)

// Bonus system
- Perfect execution + overperformance (+5)
- Perfect execution without overperformance (0)
- Imperfect execution (0)

// Edge cases
- Bodyweight exercises (no LF)
- Single exercise workouts
- Single set exercises
- Zero completions
- Over-performance without completion

// Deviations
- Detection and ranking
- Deduplication by exercise + type
- Top 3 selection
```

**Use Built-in Tests**:
```javascript
// In browser console or test suite:
DevotionScoringService.runScoringTests()
```

---

#### 2. SessionService

**Test Cases**:
```typescript
// Session creation
- Create from scratch
- Prevent duplicate creation (10-second window)
- Recover from incomplete data
- Handle missing workout
- Hierarchical creation (session → exercises → sets)

// Session updates
- updateSet() basic operations
- batchUpdateSets() with mixed operations:
  - Update existing set
  - Complete set
  - Create new set
  - Delete set
- Transaction rollback on error
- Set ordering preservation

// Session state transitions
- ACTIVE → FINISHED
- Cannot update FINISHED sessions
- Cannot delete with active references

// Authorization
- User can only access own sessions
- findFirst with userId filter
- Access denial on unauthorized user

// Edge cases
- Very large batch operations
- Concurrent updates to same session
- Session with 0 exercises
- Null previous session data
```

---

#### 3. useInMemorySession Hook

**Test Cases**:
```typescript
// Initialization
- First-time creation from workout
- Recovery from localStorage
- Recovery with corrupted data
- Recovery with different workoutId

// Set management
- updateSet() with partial updates
- toggleSetCompletion() state changes
- addSet() with previous set defaults
- Auto-save on updates
- Debounce behavior (1s)

// Navigation
- navigateToNextExercise()
- navigateToPreviousExercise()
- Block-aware navigation (blockId + blockOrder)
- Navigation boundaries (first/last)

// Block detection
- isCurrentExerciseInBlock()
- getCurrentBlock() returns sorted exercises
- Block skipping in navigation

// Utility functions
- canFinishWorkout() when ≥1 set complete
- getCurrentExercise() returns correct index
- isLastExerciseOrBlock() detection

// Persistence
- clearSession() cleanup
- Session recovery after app restart
- Timer management across lifecycle
```

---

#### 4. DashboardService

**Test Cases**:
```typescript
// Fox state calculation
- 0 sessions → SLIM
- <50% completion → SLIM
- 50-75% completion → FIT
- 75-100% completion → STRONG
- ≥100% completion → FIERY

// Devotion modifiers (require ≥4 sessions)
- Avg score ≥90 → promote one level
- Avg score <80 → demote one level
- Between 80-90 → no change

// Week calculations
- Monday as start of week
- Sunday as end of week
- Current week boundaries
- Last 8 weeks calculation
- Year boundary handling

// Week progress
- Completed count
- Planned (weeklyGoal) count
- isComplete flag

// Next workout
- Return first ACTIVE workout when not complete
- Return null when week complete
- Include exercise count and estimated duration
```

---

### 🟡 MEDIUM PRIORITY (Test Second)

#### 5. WorkoutService

```typescript
// CRUD operations
- create(), update(), delete()
- Status transitions: ACTIVE ↔ DRAFT ↔ ARCHIVED
- Authorization checks

// Estimated duration
- Formula: totalSets * 3 + (exerciseCount - 1)
- Accuracy with various set/exercise combinations

// Sorting
- getUserWorkouts(): ACTIVE first, then updated DESC
- getDraftWorkouts(): updated DESC
- Exercises/sets ordered by order field

// Hierarchical data
- Exercise ordering preservation
- Set ordering within exercises
- BlockId and blockOrder handling
```

---

#### 6. ExerciseAnalyticsService

```typescript
// Peak performance
- Max (weight × reps) calculation
- Bodyweight handling (weight = 0)

// Devotion dots (12-week activity)
- Week boundary detection
- Variable-length arrays (no padding)
- Activity detection per week
- Capped at 12 weeks

// Consistency
- Weeks with activity / available weeks
- Capped at 12 weeks
- Minimum 1 week even with 0 activity

// Chips determination
- 'foundation': consistency ≥ 0.75
- 'missing': consistency < 0.40
- Can have both chips

// Active vs archived separation
- Active: exercises in ACTIVE workouts
- Archived: everything else
```

---

#### 7. NarrativeService

```typescript
// Message priority and generation
1. Comeback messages (>5 days)
2. Consistency recognition (3+ sessions/week)
3. Workout-specific (first time in 14+ days)
4. Month progress markers
5. Encouraging messages

// Date calculations
- Days between sessions
- Week boundaries for session counting
- Month boundaries

// Context gathering
- Recent session data (30 days)
- Month sessions
- Workout frequency
```

---

### 🟢 LOW PRIORITY (Test Last)

#### 8-10. Support Services

- **ExerciseService**: Basic CRUD, duplicate prevention
- **ProfileService**: User data retrieval, week streak
- **WorkoutPreloadService**: Cache expiration, batch loading

---

## Test Data Requirements

### Fixtures Needed

```typescript
// Mock user
const mockUser = {
  id: 'test-user-123',
  clerkUserId: 'clerk_test',
  displayName: 'Test User',
  weeklyGoal: 3,
  progressionState: 'SLIM'
}

// Mock workouts (different structures)
const workouts = {
  simple: {
    id: 'workout-1',
    title: 'Basic Strength',
    exercises: 2,
    sets: 6
  },
  complex: {
    id: 'workout-2',
    title: 'Advanced Block Training',
    exercises: 6,
    sets: 18,
    blocks: true
  },
  bodyweight: {
    id: 'workout-3',
    title: 'Calisthenics',
    exercises: 3,
    sets: 9,
    equipment: 'bodyweight'
  }
}

// Mock sessions (planned vs actual)
const sessionScenarios = {
  perfect: { /* all sets, all reps, all weight */ },
  imperfect: { /* missed sets, under-reps, under-weight */ },
  mixed: { /* some perfect, some missed */ },
  overperformance: { /* all complete + bonus reps */ }
}
```

---

## Mocking Strategy

### Services to Mock

```typescript
// Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    session: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      $transaction: jest.fn((cb) => cb(mockTx))
    },
    // ... other models
  }
}))

// Auth
jest.mock('@/lib/auth', () => ({
  getCurrentUserId: () => 'test-user-123',
  isAuthenticated: () => true
}))

// localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
global.localStorage = localStorageMock
```

---

## Key Formulas to Verify

### Devotion Scoring
```
CDS = gmean([EC, SC, RF]) × 100
gmean([a, b, c]) = (a × b × c)^(1/3)

EC = exercises_completed / total_exercises
SC = sets_completed / total_sets (capped at 1.02)
RF = average([rep_fidelity_per_set])

Where rep_fidelity_set = {
  1.0 if actual_reps >= target_reps
  1 - (|actual - target| / max(1, target)) / 0.30 otherwise (clamped 0-1)
}
```

### Fox State (8-week window)
```
If sessions < 4: based on completion % only
If sessions >= 4: also apply devotion modifiers

Base state:
  < 50%: SLIM
  50-75%: FIT
  75-100%: STRONG
  >= 100%: FIERY

With modifiers (if avg_devotion_score exists):
  If avg_score >= 90 AND not FIERY: promote 1 level
  If avg_score < 80 AND not SLIM: demote 1 level
```

### Week Streak
```
Group sessions by ISO week
Count consecutive weeks from current week backward
Skip weeks with 0 sessions
```

---

## Success Criteria

### Coverage Targets

- **Critical Services**: 90%+ statement coverage
- **Medium Services**: 80%+ statement coverage
- **Low Services**: 60%+ statement coverage
- **Hooks**: 85%+ coverage
- **Overall**: 80%+ coverage

### Quality Standards

- All business logic equations verified
- Edge cases explicitly tested
- Authorization checks present
- Error messages logged
- Type safety enforced
- Database transactions tested
- Async operations handled properly

---

## Running Tests

### Unit Tests
```bash
npm run test:unit          # Run unit tests
npm run test:unit --watch  # Watch mode
npm run test:unit --coverage
```

### Integration Tests
```bash
npm run test:integration   # Requires test database
npm run test:integration --watch
```

### E2E Tests
```bash
npm run test:e2e           # Requires running dev server
npm run test:e2e --headed  # With browser visible
```

---

## Known Challenges

1. **Transaction Testing**: Mocking `$transaction()` requires care
2. **Timer Testing**: Use fake timers (`jest.useFakeTimers()`)
3. **Date Calculations**: Account for timezone differences
4. **localStorage**: Mock carefully to avoid test pollution
5. **Async Operations**: Proper await/Promise handling
6. **Block Navigation**: Complex state logic requires thorough testing

---

## Documentation References

- Full architecture: `/CODEBASE_ANALYSIS.md`
- Service details: Section 1 in CODEBASE_ANALYSIS.md
- Hook details: Section 2 in CODEBASE_ANALYSIS.md
- API routes: Section 3 in CODEBASE_ANALYSIS.md
- Business logic: Section 7 in CODEBASE_ANALYSIS.md

