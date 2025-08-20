'use client';

export function WorkoutLoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6">
            <div className="animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {/* Workout title */}
                  <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                  
                  {/* Exercise count and duration */}
                  <div className="h-4 bg-gray-200 rounded w-40 mb-2"></div>
                  
                  {/* Description (optional) */}
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
                
                {/* Play button skeleton */}
                <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0 ml-4"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
