import React, { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Button } from '../ui/Button';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';

export const DateRangeFilter = () => {
  const { salesDateRange, applySalesDateRange, isLoading } = useData();
  const { addToast } = useToast();
  const [draft, setDraft] = useState(salesDateRange);

  useEffect(() => setDraft(salesDateRange), [salesDateRange]);

  const applyFilter = async (event) => {
    event.preventDefault();
    if (!draft.from || !draft.to || draft.from > draft.to) {
      addToast('Choose a valid start and end date.', 'danger');
      return;
    }
    try {
      await applySalesDateRange(draft);
      addToast('Dashboard date range updated.', 'success');
    } catch (error) {
      addToast(error.message, 'danger');
    }
  };

  return (
    <form
      onSubmit={applyFilter}
      className="flex flex-wrap items-end gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm"
    >
      <div className="flex items-center gap-2 pr-2 text-xs font-bold text-slate-600 dark:text-slate-300">
        <CalendarDays className="h-4 w-4 text-indigo-500" />
        Sales period
      </div>
      <label className="text-[11px] font-semibold text-slate-500">
        From
        <input
          aria-label="Sales date from"
          type="date"
          value={draft.from}
          onChange={(event) => setDraft({ ...draft, from: event.target.value })}
          className="mt-1 block rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>
      <label className="text-[11px] font-semibold text-slate-500">
        To
        <input
          aria-label="Sales date to"
          type="date"
          value={draft.to}
          onChange={(event) => setDraft({ ...draft, to: event.target.value })}
          className="mt-1 block rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>
      <Button type="submit" size="sm" variant="primary" disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Apply'}
      </Button>
    </form>
  );
};
