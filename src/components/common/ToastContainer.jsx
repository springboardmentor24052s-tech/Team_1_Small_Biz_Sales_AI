import React from 'react';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    error: <XCircle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-indigo-500" />
  };

  const borders = {
    success: 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/90 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-100',
    warning: 'border-amber-200 dark:border-amber-800/60 bg-amber-50/90 dark:bg-amber-950/90 text-amber-900 dark:text-amber-100',
    error: 'border-rose-200 dark:border-rose-800/60 bg-rose-50/90 dark:bg-rose-950/90 text-rose-900 dark:text-rose-100',
    info: 'border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/90 dark:bg-indigo-950/90 text-indigo-900 dark:text-indigo-100'
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-scale-up ${
            borders[toast.type] || borders.info
          }`}
        >
          <div className="flex items-center gap-3">
            {icons[toast.type] || icons.info}
            <p className="text-xs sm:text-sm font-medium">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
