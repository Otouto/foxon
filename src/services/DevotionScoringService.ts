import { WorkoutService } from './WorkoutService';
import type { DevotionPillars, DevotionDeviation } from './SessionService';

// Helper functions as specified in requirements
const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));
const gmean = (xs: number[]) => Math.pow(xs.reduce((a, b) => a * b, 1), 1 / xs.length);
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

// Planned exercise data structure
interface PlannedExercise {
  name: string;
  sets: Array<{
    targetLoad: number;
    targetReps: number;
    order: number;
  }>;
}

// Actual exercise data structure
interface ActualExercise {
  name: string;
  sets: Array<{
    load: number;
    reps: number;
    completed: boolean;
    order: number;
  }>;
}

// Devotion score result
export interface DevotionScoreResult {
  CDS: number; // Commitment & Devotion Score (0-100)
  grade: string; // "Dialed in", "On plan", "Loose", "Off plan"
  pillars: DevotionPillars;
  deviations: DevotionDeviation[];
}

// Exercise pair for comparison
interface ExercisePair {
  planned: PlannedExercise;
  actual: ActualExercise | null;
}

// Per-exercise scoring result
interface ExerciseScore {
  name: string;
  sc: number; // Set Completion
  rf: number; // Rep Fidelity
  lf: number | null; // Load Fidelity (null if no loaded sets)
  weight: number; // Number of planned sets (for weighted averages)
  deviations: DevotionDeviation[];
}

export class DevotionScoringService {
  /**
   * Compute devotion score comparing planned workout vs actual session
   */
  static async computeDevotionScore(
    workoutId: string,
    actualExercises: ActualExercise[]
  ): Promise<DevotionScoreResult> {
    // Get planned workout data
    const plannedWorkout = await WorkoutService.getWorkoutById(workoutId);
    if (!plannedWorkout) {
      throw new Error('Planned workout not found');
    }

    // Convert planned workout to our format
    const plannedExercises: PlannedExercise[] = plannedWorkout.items.map(item => ({
      name: item.exercise.name,
      sets: item.sets.map(set => ({
        targetLoad: set.targetLoad,
        targetReps: set.targetReps,
        order: set.order
      }))
    }));

    return this.computeDevotionScoreFromData(plannedExercises, actualExercises);
  }

  /**
   * Core devotion score computation (can be used with any data)
   */
  static computeDevotionScoreFromData(
    plannedExercises: PlannedExercise[],
    actualExercises: ActualExercise[]
  ): DevotionScoreResult {
    // Match exercises by exact name, order by planned workout
    const pairs: ExercisePair[] = plannedExercises.map(planned => {
      const actual = actualExercises.find(a => a.name === planned.name) || null;
      return { planned, actual };
    });

    // A) Exercise Coverage (EC)
    const EC = pairs.filter(pair => pair.actual && pair.actual.sets.some(set => set.completed)).length / plannedExercises.length;

    // B, C, D) Calculate per-exercise scores
    const exerciseScores: ExerciseScore[] = pairs.map(({ planned, actual }) => 
      this.calculateExerciseScore(planned, actual)
    );

    // Aggregate scores using planned-set-weighted averages
    const totalWeight = exerciseScores.reduce((sum, ex) => sum + ex.weight, 0) || 1;
    
    const SC = exerciseScores.reduce((sum, ex) => sum + ex.sc * ex.weight, 0) / totalWeight;
    const RF = exerciseScores.reduce((sum, ex) => sum + ex.rf * ex.weight, 0) / totalWeight;
    
    // Load Fidelity is still calculated but not used in devotion score (focusing on process, not weight)

    // Final score calculation - focusing on devotion to process (EC, SC, RF only)
    const scoreParts = [EC, SC, RF];
    const SAC = gmean(scoreParts);
    const CDS = Math.round(100 * SAC);

    // Grade assignment
    const grade = CDS >= 90 ? 'Dialed in' : 
                  CDS >= 80 ? 'On plan' : 
                  CDS >= 70 ? 'Loose' : 
                  'Off plan';

    // Collect and rank deviations
    const allDeviations = exerciseScores.flatMap(ex => ex.deviations);
    const topDeviations = this.rankDeviations(allDeviations).slice(0, 3);

    return {
      CDS,
      grade,
      pillars: {
        EC: Math.round(EC * 100) / 100,
        SC: Math.round(SC * 100) / 100,
        RF: Math.round(RF * 100) / 100
      },
      deviations: topDeviations.filter(d => d.type !== 'load_variance')
    };
  }

  /**
   * Calculate scores for a single exercise
   */
  private static calculateExerciseScore(
    planned: PlannedExercise,
    actual: ActualExercise | null
  ): ExerciseScore {
    const plannedSets = planned.sets;
    const actualSets = actual?.sets || [];
    const deviations: DevotionDeviation[] = [];

    // B) Set Completion (SC)
    const completedSets = actualSets.filter(set => set.completed);
    const sc = clamp(completedSets.length / plannedSets.length, 0, 1.02); // Soft bonus max +2%

    // Track set completion deviations
    if (completedSets.length < plannedSets.length) {
      const missedSets = plannedSets.length - completedSets.length;
      deviations.push({
        type: 'missed_sets',
        exerciseName: planned.name,
        description: `Missed ${missedSets} set${missedSets > 1 ? 's' : ''} on ${planned.name}`,
        impact: (plannedSets.length - completedSets.length) / plannedSets.length
      });
    }

    // C) Rep Fidelity (RF)
    const repScores = plannedSets.map((plannedSet, index) => {
      const actualReps = actualSets[index]?.reps || 0;
      const repErr = Math.abs(actualReps - plannedSet.targetReps) / Math.max(1, plannedSet.targetReps);
      const rfSet = clamp(1 - repErr / 0.30, 0, 1);

      // Track significant rep deviations (>15% error)
      if (repErr > 0.15 && actualSets[index]?.completed) {
        const variance = actualReps - plannedSet.targetReps;
        deviations.push({
          type: 'rep_variance',
          exerciseName: planned.name,
          description: `${variance > 0 ? '+' : ''}${variance} reps on ${planned.name}`,
          impact: repErr
        });
      }

      return rfSet;
    });
    const rf = avg(repScores);

    // D) Load Fidelity (LF) - only for sets with planned weight > 0
    const loadedPlannedSets = plannedSets.filter(set => set.targetLoad > 0);
    let lf: number | null = null;

    if (loadedPlannedSets.length > 0) {
      const loadScores = loadedPlannedSets.map((plannedSet) => {
        // Find corresponding actual set by order
        const actualSet = actualSets.find(as => as.order === plannedSet.order);
        const actualWeight = actualSet?.load || 0;
        const baseWeight = Math.max(plannedSet.targetLoad, 5);
        const loadErr = Math.abs(actualWeight - plannedSet.targetLoad) / baseWeight;
        const lfSet = Math.min(1.05, clamp(1 - loadErr / 0.15, 0, 1));

        // Track significant load deviations (>15% error)
        if (loadErr > 0.15 && actualSet?.completed) {
          const variance = ((actualWeight - plannedSet.targetLoad) / plannedSet.targetLoad) * 100;
          deviations.push({
            type: 'load_variance',
            exerciseName: planned.name,
            description: `${variance > 0 ? '+' : ''}${Math.round(variance)}% load on ${planned.name}`,
            impact: loadErr
          });
        }

        return lfSet;
      });
      lf = avg(loadScores);
    }

    return {
      name: planned.name,
      sc,
      rf,
      lf,
      weight: plannedSets.length,
      deviations
    };
  }

  /**
   * Rank deviations by impact for "Why this score?" sheet
   */
  private static rankDeviations(deviations: DevotionDeviation[]): DevotionDeviation[] {
    return deviations
      .sort((a, b) => b.impact - a.impact) // Sort by impact (highest first)
      .filter((deviation, index, arr) => {
        // Remove duplicates for the same exercise and type
        return arr.findIndex(d => 
          d.exerciseName === deviation.exerciseName && 
          d.type === deviation.type
        ) === index;
      });
  }

  /**
   * Update a session with its devotion score
   */
  static async updateSessionWithDevotionScore(
    sessionId: string,
    workoutId: string,
    actualExercises: ActualExercise[]
  ): Promise<void> {
    try {
      const scoreResult = await this.computeDevotionScore(workoutId, actualExercises);
      
      // Import Prisma here to avoid circular dependencies
      const { prisma } = await import('@/lib/prisma');
      
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          devotionScore: scoreResult.CDS,
          devotionGrade: scoreResult.grade,
          devotionPillars: JSON.parse(JSON.stringify(scoreResult.pillars)),
          devotionDeviations: JSON.parse(JSON.stringify(scoreResult.deviations))
        }
      });
    } catch (error) {
      console.error('Failed to update session with devotion score:', error);
      // Don't throw - we don't want session completion to fail if scoring fails
    }
  }

  /**
   * Get grade color for UI display
   */
  static getGradeColor(grade: string): string {
    switch (grade) {
      case 'Dialed in': return 'text-green-600';
      case 'On plan': return 'text-blue-600';
      case 'Loose': return 'text-yellow-600';
      case 'Off plan': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  /**
   * Get pillar color based on score (0-1)
   */
  static getPillarColor(score: number): string {
    if (score >= 0.9) return 'bg-green-500';
    if (score >= 0.8) return 'bg-blue-500';
    if (score >= 0.7) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  /**
   * Test function to verify scoring logic with sample data
   */
  static runScoringTests(): void {
    console.log('🧪 Running Devotion Scoring Tests...\n');

    // Test 1: Perfect execution
    const perfectPlanned: PlannedExercise[] = [
      {
        name: 'Bench Press',
        sets: [
          { targetLoad: 100, targetReps: 8, order: 1 },
          { targetLoad: 100, targetReps: 8, order: 2 },
          { targetLoad: 100, targetReps: 8, order: 3 }
        ]
      },
      {
        name: 'Squats',
        sets: [
          { targetLoad: 120, targetReps: 10, order: 1 },
          { targetLoad: 120, targetReps: 10, order: 2 }
        ]
      }
    ];

    const perfectActual: ActualExercise[] = [
      {
        name: 'Bench Press',
        sets: [
          { load: 100, reps: 8, completed: true, order: 1 },
          { load: 100, reps: 8, completed: true, order: 2 },
          { load: 100, reps: 8, completed: true, order: 3 }
        ]
      },
      {
        name: 'Squats',
        sets: [
          { load: 120, reps: 10, completed: true, order: 1 },
          { load: 120, reps: 10, completed: true, order: 2 }
        ]
      }
    ];

    const perfectResult = this.computeDevotionScoreFromData(perfectPlanned, perfectActual);
    console.log('✅ Perfect Execution Test:');
    console.log(`   Score: ${perfectResult.CDS}/100 (${perfectResult.grade})`);
    console.log(`   Pillars: EC=${perfectResult.pillars.EC}, SC=${perfectResult.pillars.SC}, RF=${perfectResult.pillars.RF}`);
    console.log(`   Deviations: ${perfectResult.deviations.length}\n`);

    // Test 2: Missed sets and load variance
    const imperfectActual: ActualExercise[] = [
      {
        name: 'Bench Press',
        sets: [
          { load: 95, reps: 8, completed: true, order: 1 }, // -5% load
          { load: 100, reps: 9, completed: true, order: 2 }, // +1 rep
          // Missing 3rd set
        ]
      },
      {
        name: 'Squats',
        sets: [
          { load: 120, reps: 8, completed: true, order: 1 }, // -2 reps
          { load: 130, reps: 10, completed: true, order: 2 } // +10kg
        ]
      }
    ];

    const imperfectResult = this.computeDevotionScoreFromData(perfectPlanned, imperfectActual);
    console.log('⚠️  Imperfect Execution Test:');
    console.log(`   Score: ${imperfectResult.CDS}/100 (${imperfectResult.grade})`);
    console.log(`   Pillars: EC=${imperfectResult.pillars.EC}, SC=${imperfectResult.pillars.SC}, RF=${imperfectResult.pillars.RF}`);
    console.log(`   Deviations: ${imperfectResult.deviations.length}`);
    imperfectResult.deviations.forEach(dev => console.log(`     - ${dev.description}`));
    console.log('');

    // Test 3: Bodyweight exercise (no load fidelity)
    const bodyweightPlanned: PlannedExercise[] = [
      {
        name: 'Push-ups',
        sets: [
          { targetLoad: 0, targetReps: 15, order: 1 },
          { targetLoad: 0, targetReps: 15, order: 2 }
        ]
      }
    ];

    const bodyweightActual: ActualExercise[] = [
      {
        name: 'Push-ups',
        sets: [
          { load: 0, reps: 15, completed: true, order: 1 },
          { load: 0, reps: 12, completed: true, order: 2 } // -3 reps
        ]
      }
    ];

    const bodyweightResult = this.computeDevotionScoreFromData(bodyweightPlanned, bodyweightActual);
    console.log('💪 Bodyweight Exercise Test:');
    console.log(`   Score: ${bodyweightResult.CDS}/100 (${bodyweightResult.grade})`);
    console.log(`   Pillars: EC=${bodyweightResult.pillars.EC}, SC=${bodyweightResult.pillars.SC}, RF=${bodyweightResult.pillars.RF}`);

    console.log('🎯 All tests completed!');
  }
}
