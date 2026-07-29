import React, { useState, useEffect } from 'react';
import { MOCK_SALES_DATA } from '../../data/mockData';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import dashboardService from '../../services/dashboardService';
import {
  Target,
  CheckCircle2,
  TrendingUp,
  Award,
  Sparkles,
  PhoneCall,
  Mail,
  Layers,
  ArrowRight,
  Loader2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const SalesDashboard = () => {
  const { addToast } = useToast();
  const [data, setData] = useState(MOCK_SALES_DATA);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const res = await dashboardService.getSalesMetrics();
        if (res && res.kpis) {
          setData(res);
        }
      } catch (err) {
        console.warn('Sales Dashboard API Notice:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const { kpis, pipelineStages, recentLeads, dailyAchievement } = data;

  const handleContactLead = (name, method) => {
    addToast(`Initiated ${method} to ${name}`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Callout */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950 via-amber-900 to-slate-900 border border-amber-800/80 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-semibold">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Monthly Target: 90% Completed</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Sales Executive Deal Workspace</h2>
          <p className="text-sm text-amber-200">
            You need <strong className="text-white">$5,000 more in closed revenue</strong> by Friday to hit your Q3 quota bonus.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {loading && <Loader2 className="w-5 h-5 animate-spin text-amber-300" />}
          <Button
            variant="glass"
            size="sm"
            onClick={() => addToast('Opening AI Call Assistant...', 'info')}
            icon={PhoneCall}
            className="shrink-0"
          >
            Start AI Sales Calls
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Monthly Quota Progress</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{kpis.monthlyTarget.value}</h3>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{kpis.monthlyTarget.percentage} Target Reached</span>
          </div>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Closed Won Deals</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpis.closedDeals.value}</h3>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{kpis.closedDeals.change}</span>
          </div>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Active Pipeline Value</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpis.pipelineValue.value}</h3>
            <span className="text-xs font-medium text-slate-400">{kpis.pipelineValue.change}</span>
          </div>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Personal Win Rate</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpis.winRate.value}</h3>
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{kpis.winRate.change}</span>
          </div>
        </Card>
      </div>

      {/* Deal Pipeline Funnel Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>Active Deal Funnel Pipeline</span>
          </h3>
          <span className="text-xs text-slate-400">18 Opportunities Total</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pipelineStages.map((stg) => (
            <Card key={stg.stage} className={`border-t-4 ${stg.color}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{stg.stage}</span>
                <Badge variant="neutral" size="sm">{stg.count} Deals</Badge>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{stg.value}</p>
              <p className="text-[11px] text-slate-400 mt-1">Weighted est. closure</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Daily Achievement Chart & Lead Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Target vs Achieved Chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div>
              <CardTitle>Daily Target vs Achieved</CardTitle>
              <CardDescription>Daily revenue quota fulfillment</CardDescription>
            </div>
          </CardHeader>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyAchievement}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="target" fill="#64748b" name="Target ($2,000)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="achieved" fill="#4f46e5" name="Achieved" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* High Score Lead Opportunities */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              <div>
                <CardTitle>High-Probability AI Opportunities</CardTitle>
                <CardDescription>Ranked by machine-learning win probability</CardDescription>
              </div>
            </div>
          </CardHeader>

          <div className="space-y-3">
            {recentLeads.map((lead) => (
              <div
                key={lead.name}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-300 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{lead.name}</h4>
                    <Badge variant="info" size="sm">{lead.aiProbability}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">Contact: <strong>{lead.contact}</strong> • Stage: {lead.stage}</p>
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Value: {lead.amount}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleContactLead(lead.name, 'Phone Call')}
                    className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white transition-colors"
                    title="Call Lead"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleContactLead(lead.name, 'Email')}
                    className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white transition-colors"
                    title="Send Email"
                  >
                    <Mail className="w-4 h-4" />
                  </button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => addToast(`Moved ${lead.name} to Closing Stage`, 'success')}
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    Advance Deal
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
