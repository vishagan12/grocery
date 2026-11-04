import React from 'react';

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 animate-pulse space-y-6">
      {/* Admin Top Header Skeleton */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200" />
          <div className="space-y-1.5">
            <div className="h-5 w-48 bg-slate-200 rounded" />
            <div className="h-3 w-32 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="h-9 w-28 bg-slate-200 rounded-xl" />
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="h-3.5 w-20 bg-slate-100 rounded" />
            <div className="h-7 w-24 bg-slate-200 rounded" />
          </div>
        ))}
      </div>

      {/* Status Tabs Skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-28 bg-slate-200 rounded-xl shrink-0" />
        ))}
      </div>

      {/* Orders Table Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="h-12 bg-slate-100 border-b border-slate-200" />
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="h-4 w-20 bg-slate-200 rounded" />
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-4 w-40 bg-slate-100 rounded hidden sm:block" />
              <div className="h-4 w-16 bg-slate-200 rounded" />
              <div className="h-6 w-20 bg-[#F1F9EC] rounded-full" />
              <div className="h-8 w-16 bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

