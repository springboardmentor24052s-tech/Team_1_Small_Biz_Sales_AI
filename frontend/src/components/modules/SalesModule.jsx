import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../../context/ToastContext';
import { MOCK_SALES_DATA } from '../../data/mockData';
import { useData } from '../../context/DataContext';
import { ShoppingBag, Search, Plus, Filter, FileText, Download } from 'lucide-react';

export const SalesModule = () => {
  const { addToast } = useToast();
  const { salesTransactions } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const deals = salesTransactions.length
    ? salesTransactions.map((transaction) => ({
        name: transaction.external_reference || transaction.id.slice(0, 8),
        contact: transaction.source_system,
        amount: new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: transaction.currency
        }).format(Number(transaction.total_amount)),
        stage: transaction.status,
        aiProbability: `${transaction.item_count} items`
      }))
    : MOCK_SALES_DATA.recentLeads;
  const filteredDeals = deals.filter((deal) =>
    `${deal.name} ${deal.contact}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-indigo-500" />
            <span>Sales & Pipeline Management</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track active customer deals, generate invoices, and log stage conversions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Download} onClick={() => addToast('Exporting Sales Ledger CSV...', 'info')}>
            Export Ledger
          </Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => addToast('New Deal Wizard Opened', 'success')}>
            New Deal
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search deals or contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Deal Name</th>
                <th className="py-3 px-4">Key Contact</th>
                <th className="py-3 px-4">Deal Value</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">AI Score</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredDeals.map((d) => (
                <tr key={d.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{d.name}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{d.contact}</td>
                  <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{d.amount}</td>
                  <td className="py-3 px-4">
                    <Badge variant="info">{d.stage}</Badge>
                  </td>
                  <td className="py-3 px-4 font-semibold text-emerald-600">{d.aiProbability}</td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" icon={FileText} onClick={() => addToast(`Generated Invoice for ${d.name}`, 'info')}>
                      Invoice
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
