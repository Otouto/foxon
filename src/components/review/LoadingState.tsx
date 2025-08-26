'use client';

export function LoadingState() {
  return (
    <div className="space-y-0">
      {[1, 2].map((i) => (
        <div key={i}>
          {/* Group Header Placeholder */}
          <div className="w-full flex items-center justify-between py-2 pl-[5px] rounded-xl">
            <div className="text-left animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
            </div>
          </div>

          {/* Session Cards */}
          <div className="space-y-4">
            {Array.from({ length: i === 1 ? 2 : 5 }, (_, j) => (
              <div key={j} className="bg-white rounded-2xl shadow-sm border border-gray-100 h-[72px]">
                <div className="flex items-center p-3 h-full animate-pulse">
                  {/* Devotion Score Circle - Left Side */}
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-12 h-12 rounded-full border-4 border-gray-200"></div>
                  </div>

                  {/* Content - Right Side */}
                  <div className="flex-1 min-w-0">
                    {/* First Line: Session Name + Date */}
                    <div className="flex items-start justify-between mb-1">
                      <div className="h-5 bg-gray-200 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>

                    {/* Second Line: Reflection */}
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
