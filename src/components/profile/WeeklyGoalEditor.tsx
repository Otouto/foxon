'use client';

import { useState } from 'react';
import { Target, Minus, Plus } from 'lucide-react';

interface WeeklyGoalEditorProps {
  initialGoal: number;
}

export default function WeeklyGoalEditor({ initialGoal }: WeeklyGoalEditorProps) {
  const [goal, setGoal] = useState(initialGoal);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateGoal = async (newGoal: number) => {
    if (newGoal < 1 || newGoal > 7 || newGoal === goal) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ weeklyGoal: newGoal }),
      });

      if (response.ok) {
        const data = await response.json();
        setGoal(data.weeklyGoal);
      } else {
        console.error('Failed to update weekly goal:', await response.text());
      }
    } catch (error) {
      console.error('Failed to update weekly goal:', error);
      // Could add toast notification here in the future
    } finally {
      setIsUpdating(false);
    }
  };

  const increment = () => updateGoal(goal + 1);
  const decrement = () => updateGoal(goal - 1);

  return (
    <div className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
        <Target size={20} className="text-gray-600" />
      </div>
      
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">Weekly Goal</h3>
        <p className="text-sm text-gray-500">
          {goal} workout{goal !== 1 ? 's' : ''} per week
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={decrement}
          disabled={goal <= 1 || isUpdating}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
        >
          <Minus size={16} className="text-gray-600" />
        </button>
        
        <span className="text-lg font-semibold text-gray-900 min-w-[2rem] text-center">
          {goal}
        </span>
        
        <button
          onClick={increment}
          disabled={goal >= 7 || isUpdating}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
        >
          <Plus size={16} className="text-gray-600" />
        </button>
      </div>
    </div>
  );
}
