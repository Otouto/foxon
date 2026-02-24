# Foxon Architecture Summary

## Documents Created

I've analyzed the entire Foxon codebase and created two comprehensive documentation files:

1. **`CODEBASE_ANALYSIS.md`** (680 lines, 21KB)
   - Complete architecture overview
   - Detailed explanation of every service, hook, and API route
   - Business logic breakdown for critical features
   - File-by-file complexity analysis

2. **`TESTING_ROADMAP.md`** (527 lines, 12KB)
   - Structured testing plan with 3 phases
   - Specific test cases for each critical component
   - Test data requirements and mocking strategies
   - Success criteria and coverage targets

---

## Quick Reference

### Codebase Statistics

| Category | Count | Lines | Complexity |
|----------|-------|-------|------------|
| Services | 10 | ~3,290 | High |
| Custom Hooks | 16 | Unknown | High |
| API Routes | 15+ | Variable | Medium |
| Utility Functions | 16+ | ~700 | Low |
| **Total Service Layer** | - | **~3,290** | - |

---

## Critical Areas (Must Test)

### 1. Devotion Scoring System (424 lines)
**Location**: `/src/services/DevotionScoringService.ts`

**What it does**:
- Calculates workout adherence score (0-105)
- Compares planned vs actual performance
- Generates 5-grade system (Perfect, Dialed In, On Plan, Loose, Off Plan)
- Detects and ranks performance deviations

**Key Formula**:
```
CDS = gmean([EC, SC, RF]) × 100
- EC (Exercise Coverage): completed / total
- SC (Set Completion): sets done / total sets
- RF (Rep Fidelity): rep accuracy penalty
- Bonus: +5 for perfect execution with overperformance (max 105)
```

**Why Critical**: Core to app's value proposition - tracks workout quality

---

### 2. Session Management (645 lines)
**Location**: `/src/services/SessionService.ts`

**What it does**:
- Creates, reads, updates, deletes workout sessions
- Manages hierarchical data (Session → Exercise → Sets)
- Prevents duplicate creation (10-second window)
- Handles atomic transactions with timeouts

**Why Critical**: Manages all user workout data; transactions must be reliable

---

### 3. In-Memory Session State Hook (404 lines)
**Location**: `/src/hooks/useInMemorySession.ts`

**What it does**:
- Maintains local session state during workout
- Auto-saves to localStorage with debounce
- Handles block-aware exercise navigation
- Manages set creation and completion

**Why Critical**: User-facing feature; data loss would be catastrophic

---

### 4. Fox Progression System (204 lines)
**Location**: `/src/services/DashboardService.ts`

**What it does**:
- Calculates user progression level (SLIM → FIT → STRONG → FIERY)
- Based on 8-week rolling window of completion + devotion
- Shows weekly progress toward goals
- Recommends next workout

**Why Critical**: Key gamification feature; progression logic must be correct

---

## Architecture Patterns

### Service Layer Pattern
```typescript
// Pure business logic in static methods
// Database operations only here
// Error handling with logging
class DevotionScoringService {
  static async computeDevotionScore(workoutId: string, actual: ActualExercise[]) {
    // 1. Get planned workout
    // 2. Calculate scores
    // 3. Update database
  }
}
```

### Custom Hooks Pattern
```typescript
// State management and side effects
// No database access (use services)
// Memoized callbacks for performance
export function useInMemorySession(workoutId: string, preloadedData?) {
  const [session, setSession] = useState(null)
  const [isInitializing, setIsInitializing] = useState(true)
  
  const updateSet = useCallback((exerciseIdx, setIdx, updates) => {
    // Update and debounce save
  }, [])
  
  return { session, updateSet, ... }
}
```

### Database Pattern
```typescript
// Prisma ORM exclusively
// Batch operations for performance
// Transactions for atomicity
// User ID checks for authorization
const session = await prisma.$transaction((tx) => {
  // Atomic multi-step operations
}, { timeout: 30000 })
```

---

## Key Business Logic

### Devotion Score Calculation
1. **Exercise Coverage (EC)**: How many planned exercises were done?
2. **Set Completion (SC)**: How many planned sets were completed?
3. **Rep Fidelity (RF)**: Were target reps hit? (penalize under-performance only)
4. **Load Fidelity (LF)**: Was target weight hit? (informational, not in final score)

```typescript
// Geometric mean aggregation
gmean([EC, SC, RF]) × 100

// Example:
EC = 3/3 = 1.0   (all exercises done)
SC = 8/9 = 0.89  (8 of 9 sets done)
RF = 0.95        (mostly hit reps)
CDS = gmean([1.0, 0.89, 0.95]) × 100 = 94.8 → "Dialed in"
```

### Fox State Progression
```
Based on: Completion % in last 8 weeks + Average Devotion Score

Without devotion (first 3 sessions):
- 0-50% of goal → SLIM
- 50-75% of goal → FIT
- 75-100% of goal → STRONG
- ≥100% of goal → FIERY

With devotion modifiers (after 4+ sessions):
- Avg score ≥90 → promote one level
- Avg score <80 → demote one level
```

### Week Streak Calculation
```typescript
// Counts consecutive weeks with at least 1 session
// Current week backwards
// Stops on first week with 0 sessions

Example:
Week 1: 2 sessions ✓
Week 2: 1 session ✓
Week 3: 0 sessions ✗ → Streak = 2
```

---

## Testing Priorities

### Phase 1: Unit Tests (Weeks 1-2)
**Critical Services**:
1. DevotionScoringService
2. SessionService
3. useInMemorySession hook
4. DashboardService

**Expected Coverage**: 90%+

### Phase 2: Integration Tests (Weeks 3-4)
**Database + Services**:
1. Session creation with duplicate prevention
2. Batch updates and atomic operations
3. Cascade deletes
4. Transaction rollback scenarios

**Expected Coverage**: 80%+

### Phase 3: E2E Tests (Weeks 5-6)
**Full User Workflows**:
1. Create session → Complete → Seal → Verify score
2. Create workout → Update exercises → View analytics
3. Check progression and notifications

---

## Critical Formulas to Verify

### Devotion Scoring Math
```
gmean([EC, SC, RF]) = (EC × SC × RF) ^ (1/3)

Rep Fidelity for single set:
- If actual_reps >= target_reps: 1.0
- Else: 1 - (|variance| / max(1, target)) / 0.30 (clamped 0-1)

Average: sum all / count

Load Fidelity for single set:
- (Similar penalty structure, 15% threshold)
```

### Week Boundary Detection
```
Current week: Monday-Sunday
- getDay() = 0 (Sun) to 6 (Sat)
- Sunday = 6 days from Monday
- Monday = 1 day from Sunday

Example:
Nov 14 (Thu) = day 4
→ Week starts Mon Nov 11
→ Week ends Sun Nov 17
```

---

## Known Issues & Limitations

1. **Mock Authentication**: Currently returns hardcoded user; needs Clerk integration
2. **Async Scoring**: Devotion score calculated after response (potential race conditions)
3. **Workout Updates**: Full delete/recreate strategy (less efficient than patch)
4. **Week Calculation**: Custom logic (not using date-fns or similar)
5. **localStorage Persistence**: Debounced 1 second (data loss possible on crash)

---

## Files to Study First

### If testing devotion scoring:
- `/src/services/DevotionScoringService.ts` - Main logic
- `/src/lib/types/exercise.ts` - Data types
- Built-in: `DevotionScoringService.runScoringTests()`

### If testing sessions:
- `/src/services/SessionService.ts` - CRUD + transactions
- `/src/app/api/sessions/complete/route.ts` - Session completion endpoint
- `/src/hooks/useSessionCompletion.ts` - Client-side wrapper

### If testing user progression:
- `/src/services/DashboardService.ts` - Fox state calculation
- `/src/services/ProfileService.ts` - User stats aggregation
- `/src/lib/utils/dateUtils.ts` - Date calculations

### If testing analytics:
- `/src/services/ExerciseAnalyticsService.ts` - Consistency/dots
- `/src/lib/utils/sessionPatterns.ts` - Session relationships

---

## How to Use These Documents

### Start Here
1. Read this file (overview)
2. Skim CODEBASE_ANALYSIS.md Section 8 (priorities)
3. Review TESTING_ROADMAP.md (test structure)

### Deep Dives
- **Architecture**: CODEBASE_ANALYSIS.md Sections 1-6
- **Business Logic**: CODEBASE_ANALYSIS.md Section 7
- **Testing Plan**: TESTING_ROADMAP.md Sections 2-5

### Reference
- Look up any service/hook in CODEBASE_ANALYSIS.md index
- Check complexity ratings for priority order
- Use formulas section for verification

---

## Files Location

All new documentation in `/home/user/foxon/`:
- `CODEBASE_ANALYSIS.md` - Full technical reference
- `TESTING_ROADMAP.md` - Testing plan and cases
- `ARCHITECTURE_SUMMARY.md` - This file (quick reference)

---

## Quick Stats

- **Services with High Complexity**: 4 (Devotion, Session, useInMemorySession, Dashboard)
- **Services with Medium Complexity**: 5 (Workout, Analytics, Completion, Narrative, Preload)
- **Services with Low Complexity**: 3 (Exercise, Profile, Utils)
- **Recommended Test Coverage**: 80%+
- **Estimated Testing Effort**: 6-8 weeks for comprehensive coverage
- **Critical Formulas**: 5 (devotion scoring, fox state, week streak, consistency, rest days)

