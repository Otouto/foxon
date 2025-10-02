// Exercise-related TypeScript interfaces

export interface Exercise {
  id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  imageUrl: string | null;
  muscleGroup: {
    id: string;
    name: string;
  } | null;
  equipment: {
    id: string;
    name: string;
  } | null;
}

export interface ExerciseListItem {
  id: string;
  name: string;
  muscleGroup: string | null;
  equipment: string | null;
  imageUrl: string | null;
}