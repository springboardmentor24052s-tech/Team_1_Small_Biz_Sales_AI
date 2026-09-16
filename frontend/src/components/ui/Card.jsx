import React from 'react';

export const Card = ({ children, className = '', hoverEffect = true, glass = false }) => {
  const baseStyles = 'marketmind-card bg-white/95 dark:bg-slate-850 dark:bg-[#151c2c]/95 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 shadow-[0_8px_28px_rgba(15,23,42,0.06)] dark:shadow-[0_12px_34px_rgba(0,0,0,0.2)] transition-all duration-300';
  const hoverStyles = hoverEffect ? 'hover:shadow-[0_16px_38px_rgba(15,23,42,0.11)] dark:hover:shadow-[0_18px_42px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 hover:border-indigo-300/80 dark:hover:border-indigo-700/70' : '';
  const glassStyles = glass ? 'glass-panel' : '';

  return (
    <div className={`${baseStyles} ${hoverStyles} ${glassStyles} ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`flex items-center justify-between mb-5 pb-4 border-b border-slate-100 dark:border-slate-800 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2 ${className}`}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '' }) => (
  <p className={`mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400 ${className}`}>
    {children}
  </p>
);
