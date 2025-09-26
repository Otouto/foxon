// Workout-related TypeScript interfaces

export interface WorkoutListItem {
  id: string;
  title: string;
  description: string | null;
  exerciseCount: number;
  estimatedDuration: number;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutSet {
  id: string;
  type: 'WARMUP' | 'NORMAL';
  targetLoad: number;
  targetReps: number;
  order: number;
  notes: string | null;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  description: string | null;
  muscleGroup: {
    name: string;
  } | null;
  equipment: {
    name: string;
  } | null;
}

export interface WorkoutItem {
  id: string;
  order: number;
  notes: string | null;
  exercise: WorkoutExercise;
  sets: WorkoutSet[];
}

export interface WorkoutDetails {
  id: string;
  title: string;
  description: string | null;
  exerciseCount: number;
  estimatedDuration: number;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
  items: WorkoutItem[];
}

// For creating new workouts
export interface CreateWorkoutRequest {
  title: string;
  description?: string;
  items: Array<{
    exerciseId: string;
    order: number;
    notes?: string;
    sets: Array<{
      type: 'WARMUP' | 'NORMAL';
      targetLoad: number;
      targetReps: number;
      order: number;
      notes?: string;
    }>;
  }>;
}

export interface UpdateWorkoutRequest {
  title?: string;
  description?: string;
  items?: Array<{
    id?: string; // existing item ID for updates
    exerciseId: string;
    order: number;
    notes?: string;
    sets: Array<{
      id?: string; // existing set ID for updates
      type: 'WARMUP' | 'NORMAL';
      targetLoad: number;
      targetReps: number;
      order: number;
      notes?: string;
    }>;
  }>;
}

// Categorized workouts for organization
export interface CategorizedWorkouts {
  activeWorkouts: WorkoutListItem[];
  draftWorkouts: WorkoutListItem[];
  archivedWorkouts: WorkoutListItem[];
}

// Workout group for collapsible sections
export interface WorkoutGroup {
  key: string;
  title: string;
  workouts: WorkoutListItem[];
  count: number;
}
