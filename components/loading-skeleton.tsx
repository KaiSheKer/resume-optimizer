"use client";

export function LoadingSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-[#E8E8E6] dark:border-gray-700">
      {/* Score Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-[#F9F9F8] dark:bg-gray-700 rounded-lg p-6 animate-pulse-soft"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-24 h-4 bg-[#E8E8E6] dark:bg-gray-600 rounded" />
              <div className="w-8 h-8 bg-[#E8E8E6] dark:bg-gray-600 rounded-full" />
            </div>
            <div className="w-full h-2 bg-[#E8E8E6] dark:bg-gray-600 rounded-full overflow-hidden">
              <div className="h-full w-2/3 animate-shimmer rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="space-y-4">
        <div className="h-6 bg-[#F9F9F8] dark:bg-gray-700 rounded w-1/3 animate-pulse-soft" />
        <div className="space-y-2">
          <div className="h-4 bg-[#F9F9F8] dark:bg-gray-700 rounded w-full animate-pulse-soft" />
          <div className="h-4 bg-[#F9F9F8] dark:bg-gray-700 rounded w-5/6 animate-pulse-soft" />
          <div className="h-4 bg-[#F9F9F8] dark:bg-gray-700 rounded w-4/6 animate-pulse-soft" />
        </div>

        <div className="h-6 bg-[#F9F9F8] dark:bg-gray-700 rounded w-1/4 mt-8 animate-pulse-soft" />
        <div className="space-y-2">
          <div className="h-4 bg-[#F9F9F8] dark:bg-gray-700 rounded w-full animate-pulse-soft" />
          <div className="h-4 bg-[#F9F9F8] dark:bg-gray-700 rounded w-3/4 animate-pulse-soft" />
        </div>
      </div>
    </div>
  );
}
