'use client';

export function LoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="animate-pulse">
            {/* Header: Date with weekday + gym emoji */}
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 bg-gray-200 rounded w-32"></div>
              <div className="text-lg">🏋️‍♂️</div>
            </div>

            {/* Workout title */}
            <div className="mb-4">
              <div className="h-6 bg-gray-200 rounded w-24"></div>
            </div>

            {/* Devotion score circle and label placeholder */}
            <div className="flex flex-col items-center mb-4">
              <div className="mb-2">
                <div className="w-20 h-20 rounded-full border-8 border-gray-200"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>

            {/* Duration and practice time */}
            <div className="flex items-center justify-center mb-4 text-sm">
              <div className="h-3 bg-gray-200 rounded w-12"></div>
              <span className="mx-2 text-gray-300">•</span>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>

            {/* Reflection text placeholder */}
            <div className="text-center">
              <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
