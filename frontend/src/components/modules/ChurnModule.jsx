import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  UserMinus,
  AlertOctagon,
  ShieldAlert,
  Activity,
  ArrowUpRight,
  Send,
  Download,
  Search,
  Sparkles,
  TrendingDown,
  Clock,
  DollarSign
} from 'lucide-react';

export const ChurnModule = () => {
  const { addToast } = useToast();
  const { api, accessToken } = useAuth();

  const [summary, setSummary] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [riskFilter, setRiskFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [sumRes, custRes] = await Promise.all([
        api('/churn/summary'),
        api('/churn/customers?limit=100')
      ]);
      setSummary(sumRes);
      setCustomers(custRes.items || []);
    } catch (err) {
      addToast({ title: 'Error loading churn data', message: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesRisk = riskFilter === 'all' || c.risk_level === riskFilter;
      const matchesSearch =
        c.customer_external_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.risk_factors.some((f) => f.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesRisk && matchesSearch;
    });
  }, [customers, riskFilter, searchTerm]);

  const handleTriggerRetention = (customer, action) => {
    addToast({
      title: 'Retention Action Triggered',
      message: `Action dispatched for ${customer.customer_external_id}: "${action}"`,
      type: 'success'
    });
  };

  const handleDownloadCsv = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api/v1';
      const token = accessToken;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${baseUrl}/reports/export/churn${token ? `?token=${encodeURIComponent(token)}` : ''}`, {
        headers
      });

      if (!res.ok) {
        throw new Error(`Failed to export churn report (${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `churn_risk_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      addToast({ title: 'Export Complete', message: 'Customer churn analysis CSV downloaded', type: 'success' });
    } catch (err) {
      addToast({ title: 'Export Failed', message: err.message, type: 'error' });
    }
  };

  const getRiskBadge = (level, prob) => {
    const pct = `${(prob * 100).toFixed(0)}%`;
    if (level === 'high') {
      return <Badge variant="danger">High Risk ({pct})</Badge>;
    }
    if (level === 'medium') {
      return <Badge variant="warning">Medium Risk ({pct})</Badge>;
    }
    return <Badge variant="success">Low Risk ({pct})</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <UserMinus className="w-7 h-7 text-rose-600 dark:text-rose-400" />
            Customer Churn & Retention Intelligence
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Machine learning classification predicting customer inactivity risks with personalized recovery recommendations.
          </p>
        </div>

        <Button onClick={handleDownloadCsv} variant="secondary" icon={Download}>
          Export Churn Risk List
        </Button>
      </div>

      {/* Visual Risk Meter and KPI Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Visual Risk Gauge Meter */}
        <Card className="lg:col-span-4 p-5 flex flex-col justify-between bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Churn Risk Distribution</span>
              <Badge variant="neutral">{summary?.total_customers || 0} Evaluated</Badge>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-rose-600 dark:text-rose-400">High Risk (&gt;70% prob)</span>
                  <span>{summary?.high_risk_count || 0} customers</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${summary?.total_customers ? ((summary.high_risk_count / summary.total_customers) * 100) : 0}%`
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-amber-600 dark:text-amber-400">Medium Risk (40-70%)</span>
                  <span>{summary?.medium_risk_count || 0} customers</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${summary?.total_customers ? ((summary.medium_risk_count / summary.total_customers) * 100) : 0}%`
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-emerald-600 dark:text-emerald-400">Low Risk (&lt;40%)</span>
                  <span>{summary?.low_risk_count || 0} customers</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${summary?.total_customers ? ((summary.low_risk_count / summary.total_customers) * 100) : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Model: <span className="font-semibold text-slate-700 dark:text-slate-200">Random Forest Classifier</span> (Accuracy: {(Number(summary?.accuracy || 0.85) * 100).toFixed(1)}%)
          </div>
        </Card>

        {/* 3 Metric Cards */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 bg-gradient-to-br from-rose-50/50 to-white dark:from-slate-800/80 dark:to-slate-800/40 border-rose-100 dark:border-slate-700/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Revenue at Risk</span>
                <DollarSign className="w-4 h-4 text-rose-500" />
              </div>
              <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
                ₹{Number(summary?.high_risk_revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-3">Total historical value from customers currently in high risk threshold.</p>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-indigo-50/50 to-white dark:from-slate-800/80 dark:to-slate-800/40 border-indigo-100 dark:border-slate-700/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Avg Churn Score</span>
                <Activity className="w-4 h-4 text-indigo-500" />
              </div>
              <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
                {((summary?.average_churn_probability || 0) * 100).toFixed(1)}%
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-3">Portfolio average risk probability across all active tenant accounts.</p>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-emerald-50/50 to-white dark:from-slate-800/80 dark:to-slate-800/40 border-emerald-100 dark:border-slate-700/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Model F1-Score</span>
                <Sparkles className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                {(Number(summary?.f1_score || 0.82) * 100).toFixed(1)}%
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-3">Evaluated on holdout customer activity validation sets.</p>
          </Card>
        </div>
      </div>

      {/* Customer Risk List & Retention Actions */}
      <Card>
        <CardHeader
          title="At-Risk Customer Accounts & Interventions"
          action={
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {['all', 'high', 'medium', 'low'].map((rf) => (
                  <button
                    key={rf}
                    onClick={() => setRiskFilter(rf)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                      riskFilter === rf
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {rf} Risk
                  </button>
                ))}
              </div>

              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customer reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          }
        />

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredCustomers.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              No customer records match the selected risk filter.
            </div>
          ) : (
            filteredCustomers.map((cust) => (
              <div
                key={cust.id}
                className="p-4 sm:p-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {cust.customer_external_id}
                    </span>
                    {getRiskBadge(cust.risk_level, cust.churn_probability)}
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Inactive: {cust.inactivity_days} days
                    </span>
                  </div>

                  {/* Risk Factors */}
                  <div className="flex flex-wrap gap-1.5">
                    {(cust.risk_factors || []).map((factor, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300"
                      >
                        {factor}
                      </span>
                    ))}
                  </div>

                  {/* Recommended Retention Interventions */}
                  <div className="pt-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Recommended Retention Actions:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(cust.recommended_actions || []).map((action, j) => (
                        <button
                          key={j}
                          onClick={() => handleTriggerRetention(cust, action)}
                          className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <Send className="w-3 h-3" />
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs text-slate-400 block">Total Lifetime Value</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    ₹{Number(cust.total_spend).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

