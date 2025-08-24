import { useState, useCallback } from 'react';
import { EffortLevel } from '@prisma/client';
import { rpeToEffortLevel } from '@/components/ui/PillarRPEPicker';

interface UseSessionReflectionProps {
  onSubmit: (data: ReflectionFormData) => Promise<void>;
}

export interface ReflectionFormData {
  effort: EffortLevel;
  rpeValue: number; // 1-10 scale for UI
  vibeLine: string;
  note?: string;
}

export function useSessionReflection({ onSubmit }: UseSessionReflectionProps) {
  const [effort, setEffort] = useState<EffortLevel>(EffortLevel.HARD_7);
  const [rpeValue, setRpeValue] = useState<number>(7); // Default to 7 (Hard)
  const [vibeLine, setVibeLine] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form validation
  const isValid = vibeLine.trim().length > 0;

  // Handle RPE value change (1-10 scale)
  const handleRpeChange = useCallback((newRpeValue: number) => {
    setRpeValue(newRpeValue);
    setEffort(rpeToEffortLevel(newRpeValue));
  }, []);

  // Legacy method for backwards compatibility with old slider (if still needed)
  const handleEffortChange = useCallback((value: number) => {
    // Map old 1-4 scale to new RPE values for backwards compatibility
    const legacyMapping = [3, 5, 7, 9]; // Easy=3, Moderate=5, Hard=7, All_Out=9
    const rpeVal = legacyMapping[value - 1] || 7;
    handleRpeChange(rpeVal);
  }, [handleRpeChange]);

  // Get numeric value for old slider (legacy support)
  const getEffortValue = useCallback(() => {
    // Convert current RPE back to old 1-4 scale
    if (rpeValue <= 3) return 1; // Easy
    if (rpeValue <= 6) return 2; // Moderate  
    if (rpeValue <= 8) return 3; // Hard
    return 4; // All Out
  }, [rpeValue]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!isValid) {
      alert('Please add a vibe line for your session');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formData: ReflectionFormData = {
        effort,
        rpeValue,
        vibeLine: vibeLine.trim(),
        note: undefined // Notes field is hidden from UI
      };

      await onSubmit(formData);
      
    } catch (error) {
      console.error('Failed to submit reflection:', error);
      alert(error instanceof Error ? error.message : 'Failed to save reflection');
    } finally {
      setIsSubmitting(false);
    }
  }, [effort, rpeValue, vibeLine, isValid, onSubmit]);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setEffort(EffortLevel.HARD_7);
    setRpeValue(7);
    setVibeLine('');
    setNote('');
    setIsSubmitting(false);
  }, []);

  return {
    // Form state
    effort,
    rpeValue,
    vibeLine,
    note,
    isSubmitting,
    isValid,
    
    // Form actions
    setEffort,
    setRpeValue,
    setVibeLine,
    setNote,
    handleRpeChange,
    handleEffortChange, // Legacy support
    getEffortValue,     // Legacy support
    handleSubmit,
    resetForm,
  };
}
