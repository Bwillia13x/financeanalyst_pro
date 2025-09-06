import React from 'react';

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-md bg-border ${className}`} />
);

export const RouteSkeleton = () => (
  <div className="min-h-[60vh]">
    {/* Hero/Title bar */}
    <div className="h-8 w-48 mb-6 bg-border rounded-md animate-pulse" />
    {/* Cards grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border border-border rounded-xl p-4 bg-card">
          <div className="h-5 w-1/3 mb-3 bg-border rounded-md animate-pulse" />
          <div className="h-3 w-5/6 mb-2 bg-border rounded-md animate-pulse" />
          <div className="h-3 w-2/3 mb-2 bg-border rounded-md animate-pulse" />
          <div className="h-24 w-full mt-3 bg-border rounded-md animate-pulse" />
        </div>
      ))}
    </div>
  </div>
);

export default Skeleton;

