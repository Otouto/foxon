// Mock WorkoutService before importing DevotionScoringService
jest.mock('@/services/WorkoutService', () => ({
  WorkoutService: {
    getWorkoutById: jest.fn(),
  },
}))

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    session: {
      update: jest.fn(),
    },
  },
}))

import { DevotionScoringService } from '@/services/DevotionScoringService'

// Helper types matching the service
interface PlannedExercise {
  name: string
  sets: Array<{
    targetLoad: number
    targetReps: number
    order: number
  }>
}

interface ActualExercise {
  name: string
  sets: Array<{
    load: number
    reps: number
    completed: boolean
    order: number
  }>
}

describe('DevotionScoringService', () => {
  describe('computeDevotionScoreFromData', () => {
    describe('Perfect Execution', () => {
      it('should score 100 for perfect execution without overperformance', () => {
        const planned: PlannedExercise[] = [
          {
            name: 'Bench Press',
            sets: [
              { targetLoad: 100, targetReps: 8, order: 0 },
              { targetLoad: 100, targetReps: 8, order: 1 },
              { targetLoad: 100, targetReps: 8, order: 2 },
            ],
          },
        ]

        const actual: ActualExercise[] = [
          {
            name: 'Bench Press',
            sets: [
              { load: 100, reps: 8, completed: true, order: 0 },
              { load: 100, reps: 8, completed: true, order: 1 },
              { load: 100, reps: 8, completed: true, order: 2 },
            ],
          },
        ]

        const result = DevotionScoringService.computeDevotionScoreFromData(planned, actual)

        expect(result.CDS).toBe(100)
        expect(result.grade).toBe('Dialed in')
        expect(result.pillars.EC).toBe(1.0)
        expect(result.pillars.SC).toBe(1.0)
        expect(result.pillars.RF).toBe(1.0)
        expect(result.deviations).toHaveLength(0)
      })

      it('should score 105 for perfect execution with overperformance', () => {
        const planned: PlannedExercise[] = [
          {
            name: 'Bench Press',
            sets: [
              { targetLoad: 100, targetReps: 8, order: 0 },
              { targetLoad: 100, targetReps: 8, order: 1 },
            ],
          },
        ]

        const actual: ActualExercise[] = [
          {
            name: 'Bench Press',
            sets: [
              { load: 100, reps: 10, completed: true, order: 0 }, // +2 reps
              { load: 100, reps: 8, completed: true, order: 1 },
            ],
          },
        ]

        const result = DevotionScoringService.computeDevotionScoreFromData(planned, actual)

        expect(result.CDS).toBe(105)
        expect(result.grade).toBe('Perfect')
        expect(result.pillars.EC).toBe(1.0)
        expect(result.pillars.SC).toBe(1.0)
        expect(result.pillars.RF).toBe(1.0)
      })

      it('should NOT give bonus for overperformance without perfect execution', () => {
        const planned: PlannedExercise[] = [
          {
            name: 'Bench Press',
            sets: [
              { targetLoad: 100, targetReps: 8, order: 0 },
              { targetLoad: 100, targetReps: 8, order: 1 },
            ],
          },
        ]

        const actual: ActualExercise[] = [
          {
            name: 'Bench Press',
            sets: [
              { load: 100, reps: 10, completed: true, order: 0 }, // +2 reps
              { load: 100, reps: 7, completed: true, order: 1 }, // -1 rep (imperfect)
            ],
          },
        ]

        const result = DevotionScoringService.computeDevotionScoreFromData(planned, actual)

        // RF will be < 1.0 due to missed rep, so no bonus
        expect(result.CDS).toBeLessThan(105)
        expect(result.pillars.RF).toBeLessThan(1.0)
      })
    })

    describe('Missed Sets', () => {
      it('should penalize for missed sets', () => {
        const planned: PlannedExercise[] = [
          {
            name: 'Squats',
            sets: [
              { targetLoad: 120, targetReps: 10, order: 0 },
              { targetLoad: 120, targetReps: 10, order: 1 },
              { targetLoad: 120, targetReps: 10, order: 2 },
            ],
          },
        ]

        const actual: ActualExercise[] = [
          {
            name: 'Squats',
            sets: [
              { load: 120, reps: 10, completed: true, order: 0 },
              { load: 120, reps: 10, completed: true, order: 1 },
              // Missed the 3rd set
            ],
          },
        ]

        const result = DevotionScoringService.computeDevotionScoreFromData(planned, actual)

        expect(result.pillars.SC).toBeCloseTo(0.67, 1) // 2/3 sets completed
        expect(result.CDS).toBeLessThan(100)
        expect(result.deviations.length).toBeGreaterThan(0)
        expect(result.deviations[0].type).toBe('missed_sets')
        expect(result.deviations[0].description).toContain('Missed 1 set')
      })

      it('should track multiple missed sets', () => {
        const planned: PlannedExercise[] = [
          {
            name: 'Deadlifts',
            sets: [
              { targetLoad: 150, targetReps: 5, order: 0 },
              { targetLoad: 150, targetReps: 5, order: 1 },
              { targetLoad: 150, targetReps: 5, order: 2 },
            ],
          },
        ]

        const actual: ActualExercise[] = [
          {
            name: 'Deadlifts',
            sets: [
              { load: 150, reps: 5, completed: true, order: 0 },
              // Missed 2 sets
            ],
          },
        ]

        const result = DevotionScoringService.computeDevotionScoreFromData(planned, actual)

        expect(result.pillars.SC).toBeCloseTo(0.33, 1) // 1/3 sets completed
        expect(result.deviations[0].description).toContain('Missed 2 sets')
      })
    })

    describe('Rep Fidelity', () => {
      it('should NOT penalize for exceeding target reps', () => {
        const planned: PlannedExercise[] = [
          {
            name: 'Pull-ups',
            sets: [{ targetLoad: 0, targetReps: 10, order: 0 }],
          },
        ]

        const actual: ActualExercise[] = [
          {
            name: 'Pull-ups',
            sets: [{ load: 0, reps: 12, completed: true, order: 0 }], // +2 reps
          },
        ]

        const result = DevotionScoringService.computeDevotionScoreFromData(planned, actual)

        expect(result.pillars.RF).toBe(1.0) // No penalty for exceeding
      })

      it('should penalize for missing reps', () => {
        const planned: PlannedExercise[] = [
          {
            name: 'Bench Press',
            sets: [
              { targetLoad: 100, targetReps: 10, order: 0 },
              { targetLoad: 100, targetReps: 10, order: 1 },
            ],
          },
        ]

        const actual: ActualExercise[] = [
          {
            name: 'Bench Press',
            sets: [
              { load: 100, reps: 10, completed: true, order: 0 },
              { load: 100, reps: 7, completed: true, order: 1 }, // -3 reps (30% miss)
            ],
          },
        ]

        const result = DevotionScoringService.computeDevotionScoreFromData(planned, actual)

        // RF should be penalized
        expect(result.pillars.RF).toBeLessThan(1.0)
        expect(result.pillars.RF).toBeGreaterThan(0) // Not zero, still partial credit

        // Should have rep_variance deviation for significant miss (>15%)
        const repDeviation = result.deviations.find(d => d.type === 'rep_variance')
        expect(repDeviation).toBeDefined()
        expect(repDeviation?.description).toContain('-3 reps')
      })

      it('should calculate average rep fidelity across sets', () => {
        const planned: PlannedExercise[] = [
          {
            name: 'Squats',
            sets: [
              { targetLoad: 120, targetReps: 10, order: 0 },
              { targetLoad: 120, targetReps: 10, order: 1 },
              { targetLoad: 120, targetReps: 10, order: 2 },
            ],
          },
        ]

        const actual: ActualExercise[] = [
          {
            name: 'Squats',
            sets: [
              { load: 120, reps: 10, completed: true, order: 0 }, // Perfect
              { load: 120, reps: 10, completed: true, order: 1 }, // Perfect
              { load: 120, reps: 8, completed: true, order: 2 }, // -2 reps
            ],
          },
        ]

        const result = DevotionScoringService.computeDevotionScoreFromData(planned, actual)

        // RF should be between 0 and 1, averaged across all sets
        expect(result.pillars.RF).toBeGreaterThan(0.75) // Mostly good (actual is ~0.78)
        expect(result.pillars.RF).toBeLessThan(1.0)
      })
    })

    describe('Exercise Coverage', () => {
      it('should calculate EC based on exercises with completed sets', () => {
        const planned: PlannedExercise[] = [
          {
            name: 'Bench Press',
            sets: [{ targetLoad: 100, targetReps: 8, order: 0 }],
          },
          {
            name: 'Squats',
            sets: [{ targetLoad: 120, targetReps: 10, order: 0 }],
          },
          {
            name: 'Deadlifts',
            sets: [{ targetLoad: 150, targetReps: 5, order: 0 }],
          },
        ]

        const actual: ActualExercise[] = [
          {
            name: 'Bench Press',
            sets: [{ load: 100, reps: 8, completed: true, order: 0 }],
          },
          {
            name: 'Squats',
            sets: [{ load: 120, reps: 10, completed: true, order: 0 }],
          },
          // Skipped Deadlifts
        ]

        const result = DevotionScoringService.computeDevotionScoreFromData(planned, actual)

        expect(result.pillars.EC).toBeCloseTo(0.67, 1) // 2/3 exercises done
      })

      it('should NOT count exercise if no sets completed', () => {
        const planned: PlannedExercise[] = [
          {
            name: 'Bench Press',
            sets: [{ targetLoad: 100, targetReps: 8, order: 0 }],
          },
        ]

        const actual: ActualExercise[] = [
          {
            name: 'Bench Press',
            sets: [{ load: 0, reps: 0, completed: false, order: 0 }], // Not completed
          },
        ]

        const result = DevotionScoringService.computeDevotionScoreFromData(planned, actual)

        expect(result.pillars.EC).toBe(0) // No exercises with completed sets
      })
    })

    describe('Bodyweight Exercises', () => {
      it('should handle bodyweight exercises (no load fidelity)', () => {
        const planned: PlannedExercise[] = [
          {
            name: 'Push-ups',
            sets: [
              { targetLoad: 0, targetReps: 15, order: 0 },
              { targetLoad: 0, targetReps: 15, order: 1 },
            ],
          },
        ]

        const actual: ActualExercise[] = [
          {
            name: 'Push-ups',
            sets: [
              { load: 0, reps: 15, completed: true, order: 0 },
              { load: 0, reps: 15, completed: true, order: 1 },
            ],
          },
        ]

        const result = DevotionScoringService.computeDevotionScoreFromData(planned, actual)

        expect(result.CDS).toBe(100)
        expect(result.pillars.EC).toBe(1.0)
        expect(result.pillars.SC).toBe(1.0)
        expect(result.pillars.RF).toBe(1.0)
        // Load fidelity not in pillars (not used in score)
      })
    })

    describe('Grade Assignment', () => {
      it('should assign "Perfect" for scores > 100', () => {
        const planned: PlannedExercise[] = [
          {
            name: 'Test',
            sets: [{ targetLoad: 100, targetReps: 8, order: 0 }],
          },
        ]

        const actual: ActualExercise[] = [
          {
            name: 'Test',
            sets: [{ load: 100, reps: 10, completed: true, order: 0 }], // Bonus
          },
        ]

        const result = DevotionScoringService.computeDevotionScoreFromData(planned, actual)

        expect(result.CDS).toBe(105)
        expect(result.grade).toBe('Perfect')
      })

      it('should assign "Dialed in" for scores 90-100', () => {
        // Create scenario that scores around 90-100
        const planned: PlannedExercise[] = [
          {
            name: 'Test',
            sets: [
              { targetLoad: 100, targetReps: 10, order: 0 },
              { targetLoad: 100, targetReps: 10, order: 1 },
              { targetLoad: 100, targetReps: 10, order: 2 },
            ],
          },
        ]

        const actual: ActualExercise[] = [
          {
            name: 'Test',
            sets: [
              { load: 100, reps: 10, completed: true, order: 0 },
              { load: 100, reps: 10, completed: true, order: 1 },
              { load: 100, reps: 9, completed: true, order: 2 }, // Small miss
            ],
          },
        ]

        const result = DevotionScoringService.computeDevotionScoreFromData(planned, actual)

        expect(result.CDS).toBeGreaterThanOrEqual(90)
        expect(result.CDS).toBeLessThanOrEqual(100)
        expect(result.grade).toBe('Dialed in')
      })

      it('should assign "On plan" for scores 80-89', () => {
        const planned: PlannedExercise[] = [
          {
            name: 'Test',
            sets: [
              { targetLoad: 100, targetReps: 10, order: 0 },
              { targetLoad: 100, targetReps: 10, order: 1 },
              { targetLoad: 100, targetReps: 10, order: 2 },
            ],
          },
        ]

        const actual: ActualExercise[] = [
          {
            name: 'Test',
            sets: [
              { load: 100, reps: 10, completed: true, order: 0 },
              { load: 100, reps: 8, completed: true, order: 1 }, // -2 reps
              { load: 100, reps: 8, completed: true, order: 2 }, // -2 reps
            ],
          },
        ]

        const result = DevotionScoringService.computeDevotionScoreFromData(planned, actual)

        expect(result.CDS).toBeGreaterThanOrEqual(80)
        expect(result.CDS).toBeLessThan(90)
        expect(result.grade).toBe('On plan')
      })

      it('should assign "Loose" for scores 70-79', () => {
        const planned: PlannedExercise[] = [
          {
            name: 'Test',
            sets: [
              { targetLoad: 100, targetReps: 10, order: 0 },
              { targetLoad: 100, targetReps: 10, order: 1 },
              { targetLoad: 100, targetReps: 10, order: 2 },
            ],
          },
        ]

        const actual: ActualExercise[] = [
          {
            name: 'Test',
            sets: [
              { load: 100, reps: 10, completed: true, order: 0 },
              { load: 100, reps: 8, completed: true, order: 1 }, // -2 reps (less penalty)
              { load: 100, reps: 7, completed: true, order: 2 }, // -3 reps
            ],
          },
        ]

        const result = DevotionScoringService.computeDevotionScoreFromData(planned, actual)

        expect(result.CDS).toBeGreaterThanOrEqual(70)
        expect(result.CDS).toBeLessThan(80)
        expect(result.grade).toBe('Loose')
      })

      it('should assign "Off plan" for scores < 70', () => {
        const planned: PlannedExercise[] = [
          {
            name: 'Test',
            sets: [
              { targetLoad: 100, targetReps: 10, order: 0 },
              { targetLoad: 100, targetReps: 10, order: 1 },
              { targetLoad: 100, targetReps: 10, order: 2 },
            ],
          },
        ]

        const actual: ActualExercise[] = [
          {
            name: 'Test',
            sets: [
              { load: 100, reps: 5, completed: true, order: 0 }, // -5 reps
              // Missing 2 sets
            ],
          },
        ]

        const result = DevotionScoringService.computeDevotionScoreFromData(planned, actual)

        expect(result.CDS).toBeLessThan(70)
        expect(result.grade).toBe('Off plan')
      })
    })

    describe('Deviations', () => {
      it('should rank deviations by impact', () => {
        const planned: PlannedExercise[] = [
          {
            name: 'Exercise A',
            sets: [
              { targetLoad: 100, targetReps: 10, order: 0 },
              { targetLoad: 100, targetReps: 10, order: 1 },
            ],
          },
          {
            name: 'Exercise B',
            sets: [{ targetLoad: 100, targetReps: 10, order: 0 }],
          },
        ]

        const actual: ActualExercise[] = [
          {
            name: 'Exercise A',
            sets: [
              { load: 100, reps: 9, completed: true, order: 0 }, // Small miss
            ],
          },
          {
            name: 'Exercise B',
            sets: [{ load: 100, reps: 5, completed: true, order: 0 }], // Big miss
          },
        ]

        const result = DevotionScoringService.computeDevotionScoreFromData(planned, actual)

        // Should have deviations sorted by impact
        expect(result.deviations.length).toBeGreaterThan(0)

        // First deviation should be highest impact (Exercise A missed set)
        expect(result.deviations[0].exerciseName).toBe('Exercise A')
        expect(result.deviations[0].type).toBe('missed_sets')
      })

      it('should limit to top 3 deviations', () => {
        const planned: PlannedExercise[] = [
          {
            name: 'Ex1',
            sets: [
              { targetLoad: 100, targetReps: 10, order: 0 },
              { targetLoad: 100, targetReps: 10, order: 1 },
            ],
          },
          {
            name: 'Ex2',
            sets: [{ targetLoad: 100, targetReps: 10, order: 0 }],
          },
          {
            name: 'Ex3',
            sets: [{ targetLoad: 100, targetReps: 10, order: 0 }],
          },
          {
            name: 'Ex4',
            sets: [{ targetLoad: 100, targetReps: 10, order: 0 }],
          },
        ]

        const actual: ActualExercise[] = [
          {
            name: 'Ex1',
            sets: [{ load: 100, reps: 5, completed: true, order: 0 }], // Missing set + rep variance
          },
          {
            name: 'Ex2',
            sets: [{ load: 100, reps: 7, completed: true, order: 0 }], // Rep variance
          },
          {
            name: 'Ex3',
            sets: [{ load: 100, reps: 6, completed: true, order: 0 }], // Rep variance
          },
          {
            name: 'Ex4',
            sets: [{ load: 100, reps: 8, completed: true, order: 0 }], // Rep variance
          },
        ]

        const result = DevotionScoringService.computeDevotionScoreFromData(planned, actual)

        // Should limit to 3 deviations
        expect(result.deviations.length).toBeLessThanOrEqual(3)
      })

      it('should deduplicate deviations by exercise and type', () => {
        const planned: PlannedExercise[] = [
          {
            name: 'Bench Press',
            sets: [
              { targetLoad: 100, targetReps: 10, order: 0 },
              { targetLoad: 100, targetReps: 10, order: 1 },
              { targetLoad: 100, targetReps: 10, order: 2 },
            ],
          },
        ]

        const actual: ActualExercise[] = [
          {
            name: 'Bench Press',
            sets: [
              { load: 100, reps: 7, completed: true, order: 0 }, // Rep variance
              { load: 100, reps: 6, completed: true, order: 1 }, // Rep variance
              { load: 100, reps: 8, completed: true, order: 2 }, // Rep variance
            ],
          },
        ]

        const result = DevotionScoringService.computeDevotionScoreFromData(planned, actual)

        // Should only have 1 rep_variance deviation for Bench Press (deduplicated)
        const repDeviations = result.deviations.filter(
          d => d.type === 'rep_variance' && d.exerciseName === 'Bench Press'
        )
        expect(repDeviations.length).toBe(1)
      })

      it('should NOT include load_variance deviations in final result', () => {
        const planned: PlannedExercise[] = [
          {
            name: 'Squats',
            sets: [{ targetLoad: 100, targetReps: 10, order: 0 }],
          },
        ]

        const actual: ActualExercise[] = [
          {
            name: 'Squats',
            sets: [{ load: 80, reps: 10, completed: true, order: 0 }], // -20% load
          },
        ]

        const result = DevotionScoringService.computeDevotionScoreFromData(planned, actual)

        // Load variance should be filtered out
        const loadDeviations = result.deviations.filter(d => d.type === 'load_variance')
        expect(loadDeviations.length).toBe(0)
      })
    })

    describe('Edge Cases', () => {
      it('should handle empty actual exercises (zero completion)', () => {
        const planned: PlannedExercise[] = [
          {
            name: 'Bench Press',
            sets: [{ targetLoad: 100, targetReps: 8, order: 0 }],
          },
        ]

        const actual: ActualExercise[] = []

        const result = DevotionScoringService.computeDevotionScoreFromData(planned, actual)

        expect(result.CDS).toBe(0)
        expect(result.pillars.EC).toBe(0)
        expect(result.grade).toBe('Off plan')
      })

      it('should handle single exercise workout', () => {
        const planned: PlannedExercise[] = [
          {
            name: 'Deadlifts',
            sets: [{ targetLoad: 150, targetReps: 5, order: 0 }],
          },
        ]

        const actual: ActualExercise[] = [
          {
            name: 'Deadlifts',
            sets: [{ load: 150, reps: 5, completed: true, order: 0 }],
          },
        ]

        const result = DevotionScoringService.computeDevotionScoreFromData(planned, actual)

        expect(result.CDS).toBe(100)
        expect(result.pillars.EC).toBe(1.0)
      })

      it('should handle single set exercise', () => {
        const planned: PlannedExercise[] = [
          {
            name: 'Plank',
            sets: [{ targetLoad: 0, targetReps: 60, order: 0 }],
          },
        ]

        const actual: ActualExercise[] = [
          {
            name: 'Plank',
            sets: [{ load: 0, reps: 60, completed: true, order: 0 }],
          },
        ]

        const result = DevotionScoringService.computeDevotionScoreFromData(planned, actual)

        expect(result.CDS).toBe(100)
        expect(result.pillars.SC).toBe(1.0)
      })

      it('should handle exercise name mismatch (exercise not found)', () => {
        const planned: PlannedExercise[] = [
          {
            name: 'Bench Press',
            sets: [{ targetLoad: 100, targetReps: 8, order: 0 }],
          },
        ]

        const actual: ActualExercise[] = [
          {
            name: 'Different Exercise', // Name doesn't match
            sets: [{ load: 100, reps: 8, completed: true, order: 0 }],
          },
        ]

        const result = DevotionScoringService.computeDevotionScoreFromData(planned, actual)

        // Should treat Bench Press as not done
        expect(result.pillars.EC).toBe(0)
        expect(result.CDS).toBeLessThan(100)
      })

      it('should handle zero target reps (edge case)', () => {
        const planned: PlannedExercise[] = [
          {
            name: 'Test',
            sets: [{ targetLoad: 100, targetReps: 0, order: 0 }],
          },
        ]

        const actual: ActualExercise[] = [
          {
            name: 'Test',
            sets: [{ load: 100, reps: 5, completed: true, order: 0 }],
          },
        ]

        const result = DevotionScoringService.computeDevotionScoreFromData(planned, actual)

        // Should not crash, should give full credit (any reps >= 0)
        expect(result.CDS).toBeGreaterThanOrEqual(0)
        expect(result.CDS).toBeLessThanOrEqual(105)
      })
    })

    describe('Mixed Scenarios', () => {
      it('should handle workout with multiple exercises and mixed performance', () => {
        const planned: PlannedExercise[] = [
          {
            name: 'Bench Press',
            sets: [
              { targetLoad: 100, targetReps: 8, order: 0 },
              { targetLoad: 100, targetReps: 8, order: 1 },
              { targetLoad: 100, targetReps: 8, order: 2 },
            ],
          },
          {
            name: 'Squats',
            sets: [
              { targetLoad: 120, targetReps: 10, order: 0 },
              { targetLoad: 120, targetReps: 10, order: 1 },
            ],
          },
          {
            name: 'Pull-ups',
            sets: [
              { targetLoad: 0, targetReps: 12, order: 0 },
              { targetLoad: 0, targetReps: 12, order: 1 },
            ],
          },
        ]

        const actual: ActualExercise[] = [
          {
            name: 'Bench Press',
            sets: [
              { load: 100, reps: 8, completed: true, order: 0 }, // Perfect
              { load: 100, reps: 8, completed: true, order: 1 }, // Perfect
              { load: 100, reps: 7, completed: true, order: 2 }, // -1 rep
            ],
          },
          {
            name: 'Squats',
            sets: [
              { load: 120, reps: 10, completed: true, order: 0 }, // Perfect
              // Missed 2nd set
            ],
          },
          {
            name: 'Pull-ups',
            sets: [
              { load: 0, reps: 12, completed: true, order: 0 }, // Perfect
              { load: 0, reps: 15, completed: true, order: 1 }, // Overperformance
            ],
          },
        ]

        const result = DevotionScoringService.computeDevotionScoreFromData(planned, actual)

        // All 3 exercises have at least 1 completed set
        expect(result.pillars.EC).toBe(1.0)

        // SC should be penalized for missed Squat set: 6/7 ≈ 0.86
        expect(result.pillars.SC).toBeCloseTo(0.86, 1)

        // RF should be penalized for rep misses
        expect(result.pillars.RF).toBeLessThan(1.0)
        expect(result.pillars.RF).toBeGreaterThan(0.75) // Actual is ~0.8

        // Overall score should be in "On plan" to "Dialed in" range
        expect(result.CDS).toBeGreaterThan(80)
        expect(result.CDS).toBeLessThan(95)
      })
    })
  })

  describe('getGradeColor', () => {
    it('should return correct colors for each grade', () => {
      expect(DevotionScoringService.getGradeColor('Perfect')).toBe('text-purple-600')
      expect(DevotionScoringService.getGradeColor('Dialed in')).toBe('text-green-600')
      expect(DevotionScoringService.getGradeColor('On plan')).toBe('text-blue-600')
      expect(DevotionScoringService.getGradeColor('Loose')).toBe('text-yellow-600')
      expect(DevotionScoringService.getGradeColor('Off plan')).toBe('text-red-600')
      expect(DevotionScoringService.getGradeColor('Unknown')).toBe('text-gray-600')
    })
  })

  describe('getPillarColor', () => {
    it('should return correct colors for pillar scores', () => {
      expect(DevotionScoringService.getPillarColor(0.95)).toBe('bg-green-500')
      expect(DevotionScoringService.getPillarColor(0.85)).toBe('bg-blue-500')
      expect(DevotionScoringService.getPillarColor(0.75)).toBe('bg-yellow-500')
      expect(DevotionScoringService.getPillarColor(0.65)).toBe('bg-red-500')
      expect(DevotionScoringService.getPillarColor(0.5)).toBe('bg-red-500')
    })
  })
})
