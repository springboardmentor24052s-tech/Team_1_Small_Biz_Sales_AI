import React from 'react';
import { MOCK_SALES_DATA } from '../../data/mockData';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { useData } from '../../context/DataContext';
import { DateRangeFilter } from '../common/DateRangeFilter';
import {
  Target,
  CheckCircle2,
  TrendingUp,
  Award,
  Sparkles,
  PhoneCall,
  Mail,
  Calendar,
  Layers,
  ArrowRight
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
  const { salesDashboard } = useData();
  const {
    kpis: mockKpis,
    pipelineStages,
    recentLeads,
  } = MOCK_SALES_DATA;
  const money = (value) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: salesDashboard?.currency || 'INR'
    }).format(Number(value || 0));
  const kpis = {
    ...mockKpis,
    monthlyTarget: {
      ...mockKpis.monthlyTarget,
      value: salesDashboard ? money(salesDashboard.revenue.value) : mockKpis.monthlyTarget.value,
      percentage: salesDashboard ? 'Live' : mockKpis.monthlyTarget.percentage
    },
    closedDeals: {
      ...mockKpis.closedDeals,
      value: salesDashboard
        ? `${salesDashboard.transaction_count.value} Orders`
        : mockKpis.closedDeals.value,
      change: salesDashboard ? 'Imported transactions' : mockKpis.closedDeals.change
    },
    pipelineValue: {
      ...mockKpis.pipelineValue,
      value: salesDashboard
        ? money(salesDashboard.average_order_value.value)
        : mockKpis.pipelineValue.value,
      change: salesDashboard ? 'Average order value' : mockKpis.pipelineValue.change
    },
    winRate: {
      ...mockKpis.winRate,
      value: salesDashboard
        ? `${salesDashboard.quantity.value} Items`
        : mockKpis.winRate.value,
      change: salesDashboard ? 'Imported quantity' : mockKpis.winRate.change
    }
  };
  const revenueTrend = (salesDashboard?.revenue_series || []).map((point) => ({
    date: new Date(`${point.date}T00:00:00`).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short'
    }),
    revenue: Number(point.revenue)
  }));

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
            <span>Sales Coaching • Planned for Milestone 2</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Sales Executive Deal Workspace</h2>
          <p className="text-sm text-amber-200">
            Personal sales KPIs below use your authorised database records. AI coaching will be added in Milestone 2.
          </p>
        </div>

        <Button
          variant="glass"
          size="sm"
          icon={PhoneCall}
          disabled
          className="shrink-0"
        >
          Available in Milestone 2
        </Button>
      </div>

      <DateRangeFilter />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Sales Revenue</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{kpis.monthlyTarget.value}</h3>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{kpis.monthlyTarget.percentage} selected period</span>
          </div>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Completed Orders</span>
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
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Average Order Value</span>
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
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Items Sold</span>
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
          <Badge variant="warning">Planned for Milestone 2</Badge>
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
        {/* Database-backed personal revenue chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div>
              <CardTitle>Personal Revenue Trend</CardTitle>
              <CardDescription>Completed sales for the selected period</CardDescription>
            </div>
          </CardHeader>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} minTickGap={18} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff' }}
                  formatter={(value) => [money(value), 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#4f46e5" name="Revenue" radius={[4, 4, 0, 0]} />
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
                <CardDescription>Planned for Milestone 3 • sample opportunity layout</CardDescription>
              </div>
            </div>
            <Badge variant="warning">Planned for Milestone 3</Badge>
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
                    disabled
                    className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white transition-colors"
                    title="Call Lead"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleContactLead(lead.name, 'Email')}
                    disabled
                    className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white transition-colors"
                    title="Send Email"
                  >
                    <Mail className="w-4 h-4" />
                  </button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    Milestone 3
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
