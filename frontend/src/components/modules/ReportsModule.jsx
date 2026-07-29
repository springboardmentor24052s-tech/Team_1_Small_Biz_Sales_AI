import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { BarChart3, Download, Calendar, Filter, Sparkles } from 'lucide-react';

export const ReportsModule = () => {
  const { addToast } = useToast();

  const reports = [
    { title: 'Executive Monthly Financial Summary', type: 'Financial PDF', size: '2.4 MB', date: 'July 2026' },
    { title: 'Stock Movement & Inventory Valuation', type: 'CSV Audit', size: '1.1 MB', date: 'July 2026' },
    { title: 'Sales Rep Quota & Commission Ledger', type: 'Excel Spreadsheet', size: '850 KB', date: 'Q2 2026' },
    { title: 'AI Churn Risk & Retargeting Cohorts', type: 'JSON Stream', size: '540 KB', date: 'Real-Time' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-500" />
            <span>Reports & Deep Analytics</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generate custom audit statements and automated executive exports
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r) => (
          <Card key={r.title} hoverEffect>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{r.title}</h4>
                <p className="text-xs text-slate-500">{r.type} • {r.size} • Period: {r.date}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={Download}
                onClick={() => addToast(`Downloaded ${r.title}`, 'success')}
              >
                Download
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
