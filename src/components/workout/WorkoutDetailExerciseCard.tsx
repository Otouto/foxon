'use client';

import { CldImage } from 'next-cloudinary';
import { isVideoUrl } from '@/lib/utils/mediaUtils';

interface WorkoutSet {
  id: string;
  order: number;
  type: string;
  targetReps: number;
  targetLoad: number;
}

interface Exercise {
  name: string;
  imageUrl?: string | null;
  muscleGroup: {
    name: string;
  } | null;
}

interface WorkoutItem {
  id: string;
  order: number;
  notes: string | null;
  exercise: Exercise;
  sets: WorkoutSet[];
}

interface WorkoutDetailExerciseCardProps {
  item: WorkoutItem;
}

export function WorkoutDetailExerciseCard({ item }: WorkoutDetailExerciseCardProps) {
  const isVideo = item.exercise.imageUrl ? isVideoUrl(item.exercise.imageUrl) : false;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      {/* Exercise Media (Image or Video) */}
      {item.exercise.imageUrl && (
        <div className="mb-3 rounded-xl overflow-hidden">
          {isVideo ? (
            <video
              src={item.exercise.imageUrl}
              controls
              loop
              playsInline
              muted
              className="w-full h-32 object-cover"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <CldImage
              src={item.exercise.imageUrl}
              alt={item.exercise.name}
              width={800}
              height={450}
              crop="fill"
              gravity="center"
              className="w-full h-32 object-cover"
            />
          )}
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{item.exercise.name}</h4>
          <p className="text-sm text-gray-500">
            {item.sets.length} sets
            {item.exercise.muscleGroup && (
              <span className="text-gray-400"> • {item.exercise.muscleGroup.name}</span>
            )}
          </p>
        </div>
        <div className="text-sm text-gray-400 font-medium">{item.order}</div>
      </div>
      
      {/* Sets breakdown */}
      <div className="space-y-2 mb-3">
        {item.sets.map((set) => (
          <div key={set.id} className={`flex items-center justify-between text-sm rounded-lg px-3 py-2 ${
            set.type === 'WARMUP' ? 'bg-orange-50' : 'bg-gray-50'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Set {set.order}</span>
              {set.type === 'WARMUP' && (
                <span className="px-2 py-1 bg-orange-200 text-orange-800 text-xs font-medium rounded-lg">
                  W
                </span>
              )}
            </div>
            <span className="text-gray-900 font-medium">
              {set.targetReps} reps × {set.targetLoad > 0 ? `${set.targetLoad}kg` : 'Bodyweight'}
            </span>
          </div>
        ))}
      </div>
      
      {item.notes && (
        <p className="text-xs text-gray-500 italic">💡 {item.notes}</p>
      )}
    </div>
  );
}

