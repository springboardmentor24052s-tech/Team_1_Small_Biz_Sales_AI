import React from 'react';
import { ManagerDashboard } from '../dashboards/ManagerDashboard';

export const InventoryModule = () => {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
        📦 Inventory Control Module — Full Store Stock Management View
      </div>
      <ManagerDashboard />
    </div>
  );
};
