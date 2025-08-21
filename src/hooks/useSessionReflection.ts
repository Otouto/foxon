import { useState, useCallback } from 'react';
import { EffortLevel } from '@prisma/client';

interface UseSessionReflectionProps {
  onSubmit: (data: ReflectionFormData) => Promise<void>;
}

export interface ReflectionFormData {
  effort: EffortLevel;
  vibeLine: string;
  note?: string;
}

export function useSessionReflection({ onSubmit }: UseSessionReflectionProps) {
  const [effort, setEffort] = useState<EffortLevel>(EffortLevel.HARD);
  const [vibeLine, setVibeLine] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form validation
  const isValid = vibeLine.trim().length > 0;

  // Handle effort level change with proper type safety
  const handleEffortChange = useCallback((value: number) => {
    const effortLevels = [EffortLevel.EASY, EffortLevel.STEADY, EffortLevel.HARD, EffortLevel.ALL_IN];
    const selectedEffort = effortLevels[value - 1];
    if (selectedEffort) {
      setEffort(selectedEffort);
    }
  }, []);

  // Get numeric value for effort slider
  const getEffortValue = useCallback(() => {
    return Object.values(EffortLevel).indexOf(effort) + 1;
  }, [effort]);

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
        vibeLine: vibeLine.trim(),
        note: note.trim() || undefined
      };

      await onSubmit(formData);
      
    } catch (error) {
      console.error('Failed to submit reflection:', error);
      alert(error instanceof Error ? error.message : 'Failed to save reflection');
    } finally {
      setIsSubmitting(false);
    }
  }, [effort, vibeLine, note, isValid, onSubmit]);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setEffort(EffortLevel.HARD);
    setVibeLine('');
    setNote('');
    setIsSubmitting(false);
  }, []);

  return {
    // Form state
    effort,
    vibeLine,
    note,
    isSubmitting,
    isValid,
    
    // Form actions
    setEffort,
    setVibeLine,
    setNote,
    handleEffortChange,
    getEffortValue,
    handleSubmit,
    resetForm,
  };
}
