'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ImageUploadField } from '@/components/exercise/ImageUploadField';

interface MuscleGroup {
  id: string;
  name: string;
}

interface Equipment {
  id: string;
  name: string;
}

interface Exercise {
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

function EditExercisePageInner() {
  const router = useRouter();
  const params = useParams();
  const exerciseId = params.id as string;

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [exerciseName, setExerciseName] = useState('');
  const [muscleGroupId, setMuscleGroupId] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [instructions, setInstructions] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch exercise data and dropdown options
  useEffect(() => {
    async function loadData() {
      try {
        const [exerciseRes, muscleGroupsRes, equipmentRes] = await Promise.all([
          fetch(`/api/exercises/${exerciseId}`),
          fetch('/api/muscle-groups'),
          fetch('/api/equipment')
        ]);

        if (!exerciseRes.ok) {
          throw new Error('Exercise not found');
        }

        const { exercise: exerciseData } = await exerciseRes.json();
        setExercise(exerciseData);
        setExerciseName(exerciseData.name);
        setMuscleGroupId(exerciseData.muscleGroup?.id || '');
        setEquipmentId(exerciseData.equipment?.id || '');
        setInstructions(exerciseData.instructions || '');
        setImageUrl(exerciseData.imageUrl);

        if (muscleGroupsRes.ok) {
          const data = await muscleGroupsRes.json();
          setMuscleGroups(data.muscleGroups);
        }

        if (equipmentRes.ok) {
          const data = await equipmentRes.json();
          setEquipment(data.equipment);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        setSaveError(error instanceof Error ? error.message : 'Failed to load exercise');
      } finally {
        setIsLoadingData(false);
      }
    }

    loadData();
  }, [exerciseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!exerciseName.trim()) {
      setSaveError('Exercise name is required');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch(`/api/exercises/${exerciseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: exerciseName.trim(),
          muscleGroupId: muscleGroupId || null,
          equipmentId: equipmentId || null,
          instructions: instructions.trim() || null,
          imageUrl: imageUrl || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update exercise');
      }

      // Success - navigate back to Exercises tab
      router.push('/workout?tab=exercises');
    } catch (error) {
      console.error('Failed to update exercise:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to update exercise');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/workout?tab=exercises" className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Exercise</h1>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-cyan-400 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/workout?tab=exercises" className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Exercise Not Found</h1>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">This exercise could not be found.</p>
          <Link href="/workout?tab=exercises" className="text-cyan-400 mt-4 inline-block">
            Back to Exercises
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 pb-above-nav">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/workout?tab=exercises" className="p-2 -ml-2">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Exercise</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Exercise Name */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Exercise Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={exerciseName}
            onChange={(e) => setExerciseName(e.target.value)}
            placeholder="e.g., Barbell Bench Press"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
            required
          />
        </div>

        {/* Muscle Group */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Muscle Group
          </label>
          <select
            value={muscleGroupId}
            onChange={(e) => setMuscleGroupId(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
          >
            <option value="">Select muscle group (optional)</option>
            {muscleGroups.map((mg) => (
              <option key={mg.id} value={mg.id}>
                {mg.name}
              </option>
            ))}
          </select>
        </div>

        {/* Equipment */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Equipment
          </label>
          <select
            value={equipmentId}
            onChange={(e) => setEquipmentId(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
          >
            <option value="">Select equipment (optional)</option>
            {equipment.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name}
              </option>
            ))}
          </select>
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Instructions
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Optional: Add instructions for this exercise"
            rows={4}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none"
          />
        </div>

        {/* Image/Video Upload */}
        <ImageUploadField
          value={imageUrl}
          onChange={setImageUrl}
        />

        {/* Error Message */}
        {saveError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm font-medium">{saveError}</p>
          </div>
        )}

        {/* Save Button */}
        <div className="fixed bottom-above-nav left-6 right-6">
          <button
            type="submit"
            disabled={isSaving || !exerciseName.trim()}
            className="w-full bg-cyan-400 text-white font-semibold py-4 rounded-2xl hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Updating...
              </div>
            ) : (
              'Update Exercise'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function EditExercisePage() {
  return (
    <Suspense fallback={<div className="px-6 py-8">Loading...</div>}>
      <EditExercisePageInner />
    </Suspense>
  );
}
