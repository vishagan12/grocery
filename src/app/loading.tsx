import React from 'react';

export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-[#FBF8F3] pb-16 animate-pulse">
      {/* Top Header Placeholder */}
      <div className="bg-[#76CA3E] h-16 w-full opacity-80" />

      {/* Hero Banner Skeleton */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="h-44 sm:h-56 md:h-72 w-full rounded-3xl bg-slate-200 shadow-sm" />
      </div>

      {/* Categories Row Skeleton */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="h-6 w-36 bg-slate-200 rounded-md mb-3" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-200" />
              <div className="h-3 w-12 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Featured Products Grid Skeleton */}
      <div className="max-w-7xl mx-auto px-4 pt-8">
        <div className="h-6 w-48 bg-slate-200 rounded-md mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-3 space-y-3">
              <div className="h-28 sm:h-36 bg-slate-100 rounded-xl" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-7 w-14 bg-[#F1F9EC] rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

