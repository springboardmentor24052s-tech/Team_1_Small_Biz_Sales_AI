import React, { useState } from 'react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { useData } from '../../context/DataContext';
import { Users, Search, UserPlus, Mail } from 'lucide-react';

export const CustomersModule = () => {
  const { addToast } = useToast();
  const { customers: liveCustomers, customerSegments, customerSegmentSummary } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const customerRows = customerSegments.length ? customerSegments : liveCustomers;
  const customers = customerRows.map((customer) => {
      return {
        id: customer.external_customer_id,
        name: `Customer ${customer.external_customer_id}`,
        segment: customer.segment_name || 'Not segmented',
        lifetimeValue: new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR'
        }).format(Number(customer.total_revenue)),
        engagement: customer.engagement_score
          ? `${Number(customer.engagement_score).toFixed(1)}/100`
          : 'Pending',
        recency: `${customer.recency_days} days since purchase`
      };
    });
  const filteredCustomers = customers.filter((customer) =>
    `${customer.id} ${customer.name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-500" />
            <span>Customer Intelligence Directory</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Database-backed customer segments and transaction engagement analysis
          </p>
          {customerSegmentSummary && (
            <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">
              {customerSegmentSummary.customer_count.toLocaleString('en-IN')} customers across{' '}
              {customerSegmentSummary.segments.length} segments · model{' '}
              {customerSegmentSummary.model_version}
            </p>
          )}
        </div>

        <Button variant="primary" size="sm" icon={UserPlus} onClick={() => addToast('Add Customer Modal Opened', 'info')}>
          Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer account..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Account ID</th>
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4">Customer Segment</th>
                <th className="py-3 px-4">Lifetime Value</th>
                <th className="py-3 px-4">Engagement</th>
                <th className="py-3 px-4">Recent Activity</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-400">{c.id}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{c.name}</td>
                  <td className="py-3 px-4 font-medium text-amber-500">{c.segment}</td>
                  <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{c.lifetimeValue}</td>
                  <td className="py-3 px-4">
                    <Badge variant={c.engagement === 'Pending' ? 'warning' : 'success'}>{c.engagement}</Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{c.recency}</td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" icon={Mail} onClick={() => addToast(`Email campaign triggered for ${c.name}`, 'success')}>
                      Contact
                    </Button>
                  </td>
                </tr>
              ))}
              {!filteredCustomers.length && (
                <tr>
                  <td colSpan="7" className="py-8 px-4 text-center text-slate-500 dark:text-slate-400">
                    No customer records match this search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
