import { useState } from 'react';
import { WheelPicker, WheelPickerWrapper } from '@/components/wheel-picker';
import { PickerOption } from '../../../hooks/usePickerOptions';

interface PickerSectionProps {
  isBodyweightExercise: boolean;
  weight: number;
  reps: number;
  weightOptions: PickerOption[];
  repOptions: PickerOption[];
  onWeightChange: (newWeight: string) => void;
  onRepsChange: (newReps: string) => void;
  onInteractionStart: () => void;
  onInteractionEnd: () => void;
}

export function PickerSection({
  isBodyweightExercise,
  weight,
  reps,
  weightOptions,
  repOptions,
  onWeightChange,
  onRepsChange,
  onInteractionStart,
  onInteractionEnd,
}: PickerSectionProps) {
  const [weightValue, setWeightValue] = useState(weight.toString());
  const [repsValue, setRepsValue] = useState(reps.toString());

  const handleWeightChange = (newWeight: string) => {
    setWeightValue(newWeight);
    onWeightChange(newWeight);
  };

  const handleRepsChange = (newReps: string) => {
    setRepsValue(newReps);
    onRepsChange(newReps);
  };

  const handlePointerEvent = (eventType: 'start' | 'end', event: React.PointerEvent) => {
    event.stopPropagation();
    if (eventType === 'start') {
      onInteractionStart();
    } else {
      onInteractionEnd();
    }
  };

  const handleTouchEvent = (event: React.TouchEvent) => {
    event.stopPropagation();
  };

  const handleMouseEvent = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Labels */}
      <div className="flex justify-center gap-16 px-6 mb-4">
        {!isBodyweightExercise && (
          <div className="text-center">
            <label className="text-sm font-medium text-gray-600">Weight (kg)</label>
          </div>
        )}
        <div className="text-center">
          <label className="text-sm font-medium text-gray-600">Reps</label>
        </div>
      </div>

      {/* Wheel Pickers */}
      <div 
        className="flex-1 flex items-center justify-center px-6 mb-4"
        onPointerDown={(e) => handlePointerEvent('start', e)}
        onPointerUp={(e) => handlePointerEvent('end', e)}
        onPointerCancel={(e) => handlePointerEvent('end', e)}
        onTouchStart={handleTouchEvent}
        onTouchMove={handleTouchEvent}
        onTouchEnd={handleTouchEvent}
        onMouseDown={handleMouseEvent}
        onMouseMove={handleMouseEvent}
        onMouseUp={handleMouseEvent}
      >
        <div className="w-64">
          <WheelPickerWrapper>
            {!isBodyweightExercise && (
              <WheelPicker
                options={weightOptions}
                value={weightValue}
                onValueChange={handleWeightChange}
                infinite
              />
            )}
            <WheelPicker
              options={repOptions}
              value={repsValue}
              onValueChange={handleRepsChange}
              infinite
            />
          </WheelPickerWrapper>
        </div>
      </div>
    </div>
  );
}