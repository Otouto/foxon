'use client';

import Link from 'next/link';
import { ArrowLeft, Check, Plus } from 'lucide-react';
import { workoutSeedData } from '@/lib/seedData';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function LogSessionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const workoutId = searchParams.get('workout');
  const currentExerciseIndex = parseInt(searchParams.get('exercise') || '0');
  
  // Get workout data based on the workout parameter
  const workout = workoutId ? workoutSeedData[workoutId] : null;
  const currentExercise = workout?.exercises_list[currentExerciseIndex];
  
  // State for tracking completed sets
  const [completedSets, setCompletedSets] = useState<boolean[]>([]);
  
  // State for tracking current set values
  const [setValues, setSetValues] = useState<Array<{weight: number, reps: number}>>([]);
  
  // Timer state
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  
  // Reset state when exercise changes
  useEffect(() => {
    if (currentExercise) {
      setCompletedSets(new Array(currentExercise.sets.length).fill(false));
      setSetValues(currentExercise.sets.map(set => ({ weight: set.weight, reps: set.reps })));
    }
  }, [currentExerciseIndex, currentExercise]);
  
  // Initialize timer when component mounts or retrieve from session storage
  useEffect(() => {
    const sessionKey = `workout_timer_${workoutId}`;
    const savedStartTime = sessionStorage.getItem(sessionKey);
    
    if (savedStartTime) {
      setStartTime(parseInt(savedStartTime));
    } else {
      const now = Date.now();
      setStartTime(now);
      sessionStorage.setItem(sessionKey, now.toString());
    }
  }, [workoutId]);
  
  // Update current time every second
  useEffect(() => {
    if (!startTime) return;
    
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [startTime]);
  
  // Check if this is a bodyweight exercise (all sets have weight = 0)
  const isBodyweightExercise = currentExercise?.sets.every(set => set.weight === 0) || false;
  
  // Calculate elapsed time
  const elapsedTime = startTime ? Math.floor((currentTime - startTime) / 1000) : 0;
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Helper functions
  const toggleSetCompletion = (setIndex: number) => {
    setCompletedSets(prev => {
      const newState = [...prev];
      newState[setIndex] = !newState[setIndex];
      return newState;
    });
  };
  
  const updateSetValue = (setIndex: number, field: 'weight' | 'reps', value: number) => {
    setSetValues(prev => {
      const newValues = [...prev];
      newValues[setIndex] = { ...newValues[setIndex], [field]: value };
      return newValues;
    });
  };
  
  const handleCompleteSet = () => {
    const nextExerciseIndex = currentExerciseIndex + 1;
    if (nextExerciseIndex < (workout?.exercises_list.length || 0)) {
      // Go to next exercise
      router.push(`/session/log?workout=${workoutId}&exercise=${nextExerciseIndex}`);
    } else {
      // Go to finish page if it's the last exercise
      // Store final duration in session storage
      const finalDuration = elapsedTime;
      sessionStorage.setItem(`workout_duration_${workoutId}`, finalDuration.toString());
      router.push(`/session/finish?workout=${workoutId}`);
    }
  };
  
  const handleAddSet = () => {
    if (!currentExercise || setValues.length === 0) return;
    
    // Get the last set's values as defaults for the new set
    const lastSet = setValues[setValues.length - 1];
    const newSet = { weight: lastSet.weight, reps: lastSet.reps };
    
    // Add new set to state arrays
    setSetValues(prev => [...prev, newSet]);
    setCompletedSets(prev => [...prev, false]);
  };
  
  if (!workout || !currentExercise) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Workout not found</h1>
        <Link href="/workout" className="text-cyan-400 mt-4 block">← Back to workouts</Link>
      </div>
    );
  }
  return (
    <div className="px-6 py-8 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href={`/workout/${workoutId}`} className="p-2 -ml-2 cursor-pointer">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{workout.name}</h1>
            <p className="text-sm text-gray-500">Exercise {currentExerciseIndex + 1} of {workout.exercises}</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">{formatTime(elapsedTime)}</div>
      </div>

      {/* Current Exercise */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{currentExercise.name}</h2>
        
        {/* Column Headers */}
        <div className="flex items-center gap-3 pb-3 mb-3 border-b border-gray-100">
          <div className="w-6"></div> {/* Space for check icon */}
          <div className={`flex-1 grid gap-2 text-center ${isBodyweightExercise ? 'grid-cols-3' : 'grid-cols-4'}`}>
            <p className="text-xs text-gray-500 font-medium">SET</p>
            <p className="text-xs text-gray-500 font-medium">PREVIOUS</p>
            {!isBodyweightExercise && <p className="text-xs text-gray-500 font-medium">KG</p>}
            <p className="text-xs text-gray-500 font-medium">REPS</p>
          </div>
        </div>
        
        {/* Sets */}
        <div className="space-y-3">
          {setValues.map((set, index) => {
            // Mock previous session data - in real app this would come from database
            const previousSet = {
              weight: isBodyweightExercise ? 0 : (index === 0 ? 24 : 28),
              reps: isBodyweightExercise 
                ? (index === 0 ? 8 : index === 1 ? 6 : index === 2 ? 4 : Math.max(4 - (index - 2), 1))
                : 12
            };
            
            return (
              <div 
                key={index}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  completedSets[index] 
                    ? 'bg-lime-50 border border-lime-200' 
                    : 'bg-gray-50'
                }`}
              >
                <button 
                  onClick={() => toggleSetCompletion(index)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer ${
                    completedSets[index]
                      ? 'bg-lime-400'
                      : 'bg-gray-300'
                  }`}
                >
                  <Check size={14} className={completedSets[index] ? "text-black" : "text-gray-500"} />
                </button>
                
                <div className={`flex-1 grid gap-2 items-center text-center ${isBodyweightExercise ? 'grid-cols-3' : 'grid-cols-4'}`}>
                  <div>
                    <p className="font-medium text-gray-900">{index + 1}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">
                      {isBodyweightExercise ? `${previousSet.reps}` : `${previousSet.weight}kg × ${previousSet.reps}`}
                    </p>
                  </div>
                  {!isBodyweightExercise && (
                    <div>
                      {completedSets[index] ? (
                        <p className="font-medium text-gray-900">{setValues[index]?.weight || set.weight}</p>
                      ) : (
                        <input 
                          type="number" 
                          value={setValues[index]?.weight || set.weight}
                          onChange={(e) => updateSetValue(index, 'weight', parseInt(e.target.value) || 0)}
                          className="w-16 text-center font-medium bg-transparent border-b border-gray-400 focus:outline-none focus:border-cyan-400 text-gray-900"
                        />
                      )}
                    </div>
                  )}
                  <div>
                    {completedSets[index] ? (
                      <p className="font-medium text-gray-900">{setValues[index]?.reps || set.reps}</p>
                    ) : (
                      <input 
                        type="number" 
                        value={setValues[index]?.reps || set.reps}
                        onChange={(e) => updateSetValue(index, 'reps', parseInt(e.target.value) || 0)}
                        className="w-16 text-center font-medium bg-transparent border-b border-gray-400 focus:outline-none focus:border-cyan-400 text-gray-900"
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-8">
        <button 
          onClick={handleCompleteSet}
          className="flex-1 bg-cyan-400 text-white font-semibold py-3 rounded-xl cursor-pointer"
        >
          Complete Set
        </button>
        <button 
          onClick={handleAddSet}
          className="px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
        >
          <Plus size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Finish Button */}
      <div className="fixed bottom-24 left-6 right-6">
        <button 
          onClick={() => {
            // Store final duration in session storage
            const finalDuration = elapsedTime;
            sessionStorage.setItem(`workout_duration_${workoutId}`, finalDuration.toString());
            router.push(`/session/finish?workout=${workoutId}`);
          }}
          className="w-full bg-lime-400 text-black font-semibold py-4 rounded-2xl text-center block cursor-pointer"
        >
          Finish Workout
        </button>
      </div>
    </div>
  );
}
