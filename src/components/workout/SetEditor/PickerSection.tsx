import { WheelPicker, WheelPickerWrapper } from '@ncdai/react-wheel-picker';
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
        onPointerMove={handleTouchEvent}
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
                value={weight.toString()}
                onValueChange={onWeightChange}
                options={weightOptions}
                infinite
              />
            )}
            <WheelPicker
              value={reps.toString()}
              onValueChange={onRepsChange}
              options={repOptions}
              infinite
            />
          </WheelPickerWrapper>
        </div>
      </div>
    </div>
  );
}