import React from 'react';

export default function OrdersLoading() {
  return (
    <div className="min-h-screen bg-[#FBF8F3] py-8 animate-pulse">
      <div className="max-w-3xl mx-auto px-4 space-y-6">
        {/* Page Title Skeleton */}
        <div className="h-7 w-44 bg-slate-200 rounded-md" />

        {/* Active Order Card Skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-1.5">
              <div className="h-5 w-32 bg-slate-200 rounded" />
              <div className="h-3 w-24 bg-slate-100 rounded" />
            </div>
            <div className="h-7 w-20 bg-[#F1F9EC] rounded-full" />
          </div>

          {/* Stepper Skeleton */}
          <div className="grid grid-cols-4 gap-2 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="w-8 h-8 rounded-full bg-slate-200" />
                <div className="h-2.5 w-12 bg-slate-100 rounded" />
              </div>
            ))}
          </div>

          {/* Order Items Summary */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-4 bg-slate-100 rounded w-2/3" />
          </div>
        </div>

        {/* Past Order Card Skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 opacity-75">
          <div className="flex justify-between items-center">
            <div className="h-4 w-28 bg-slate-200 rounded" />
            <div className="h-6 w-16 bg-slate-100 rounded-full" />
          </div>
          <div className="h-4 w-1/2 bg-slate-100 rounded" />
        </div>
      </div>
    </div>
  );
}

