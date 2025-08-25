import { EffortLevel, effortLevelConfig } from '@/lib/constants/effortLevels';

interface EffortIndicatorProps {
  effort: string;
  className?: string;
}

export function EffortIndicator({ effort, className = '' }: EffortIndicatorProps) {
  const effortConfig = effortLevelConfig[effort as EffortLevel];
  
  if (!effortConfig) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm font-medium">{effortConfig.label}</span>
      <div className={`w-3 h-3 ${effortConfig.color} rounded-full`}></div>
    </div>
  );
}