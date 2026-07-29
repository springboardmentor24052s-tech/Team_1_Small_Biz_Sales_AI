import React from 'react';

export const Card = ({ children, className = '', hoverEffect = true, glass = false }) => {
  const baseStyles = 'bg-white dark:bg-slate-850 dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm transition-all duration-300';
  const hoverStyles = hoverEffect ? 'hover:shadow-lg hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-slate-700' : '';
  const glassStyles = glass ? 'glass-panel' : '';

  return (
    <div className={`${baseStyles} ${hoverStyles} ${glassStyles} ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 ${className}`}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '' }) => (
  <p className={`text-xs text-slate-500 dark:text-slate-400 ${className}`}>
    {children}
  </p>
);
