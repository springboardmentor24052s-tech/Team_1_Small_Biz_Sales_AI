import React from 'react';

export const Skeleton = ({ className = '', height = 'h-4', width = 'w-full', rounded = 'rounded-lg' }) => {
  return (
    <div className={`skeleton-pulse ${height} ${width} ${rounded} ${className}`} />
  );
};

export const CardSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton width="w-1/3" height="h-4" />
      <Skeleton width="w-8" height="h-8" rounded="rounded-full" />
    </div>
    <Skeleton width="w-1/2" height="h-8" />
    <Skeleton width="w-2/3" height="h-3" />
  </div>
);
