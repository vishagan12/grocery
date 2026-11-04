import React from 'react';

export default function ProductsLoading() {
  return (
    <div className="min-h-screen bg-[#FBF8F3] py-6 animate-pulse">
      <div className="max-w-7xl mx-auto px-4">
        {/* Category Pills Bar Skeleton */}
        <div className="flex gap-2 pb-3 overflow-hidden">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-8 w-24 bg-slate-200 rounded-full shrink-0" />
          ))}
        </div>

        {/* Filters and Sorting Skeleton */}
        <div className="flex justify-between items-center py-4">
          <div className="h-5 w-32 bg-slate-200 rounded" />
          <div className="h-8 w-36 bg-slate-200 rounded-xl" />
        </div>

        {/* 8-Product Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 mt-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-3 space-y-3">
              <div className="h-32 sm:h-40 bg-slate-100 rounded-xl" />
              <div className="h-4 bg-slate-200 rounded w-4/5" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                <div className="h-5 bg-slate-200 rounded w-1/3" />
                <div className="h-8 w-16 bg-[#F1F9EC] rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

