import React from 'react';
import { MOCK_OWNER_DATA } from '../../data/mockData';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  BarChart2,
  PieChart as PieIcon,
  Download
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const OwnerDashboard = () => {
  const { addToast } = useToast();
  const { kpis, salesTrend, categoryDistribution, topProducts, aiRecommendations } = MOCK_OWNER_DATA;

  const handleAction = (title) => {
    addToast(`Triggered AI Recommendation: ${title}`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & AI Recommendation Callout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            <span>AI Executive Briefing</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Business Owner Strategic Command</h2>
          <p className="text-sm text-indigo-200">
            July gross revenue is tracking 18.4% ahead of target. AI recommends immediate inventory reorder for Q3 peak.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="glass"
            size="sm"
            onClick={() => addToast('Exporting Q3 Financial Strategy PDF...', 'info')}
            icon={Download}
          >
            Export Strategy Report
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Total Revenue</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpis.totalRevenue.value}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="flex items-center font-bold text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {kpis.totalRevenue.change}
              </span>
              <span className="text-slate-400">{kpis.totalRevenue.timeFrame}</span>
            </div>
          </div>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Total Orders</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpis.totalOrders.value}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="flex items-center font-bold text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {kpis.totalOrders.change}
              </span>
              <span className="text-slate-400">{kpis.totalOrders.timeFrame}</span>
            </div>
          </div>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Active Customers</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpis.totalCustomers.value}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="flex items-center font-bold text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {kpis.totalCustomers.change}
              </span>
              <span className="text-slate-400">{kpis.totalCustomers.timeFrame}</span>
            </div>
          </div>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Gross Profit</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpis.grossProfit.value}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="flex items-center font-bold text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {kpis.grossProfit.change}
              </span>
              <span className="text-slate-400">{kpis.grossProfit.timeFrame}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line / Area Chart - Sales & Profit Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Revenue vs Profit Growth</CardTitle>
              <CardDescription>Monthly financial performance analysis</CardDescription>
            </div>
            <Badge variant="info">Real-time Stream</Badge>
          </CardHeader>
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                  formatter={(value) => [`$${value.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" name="Gross Profit" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie Chart - Category Distribution */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Sales Category Share</CardTitle>
              <CardDescription>Revenue by merchandise sector</CardDescription>
            </div>
          </CardHeader>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {categoryDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-slate-100">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* AI Insights Panel & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Recommendations Panel */}
        <Card className="lg:col-span-2 border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/30 dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-600 text-white">
                <Zap className="w-5 h-5 animate-bounce-slow" />
              </div>
              <div>
                <CardTitle>AI Strategic Insights Engine</CardTitle>
                <CardDescription>Automated growth and pricing opportunities</CardDescription>
              </div>
            </div>
            <Badge variant="success">3 Signals Active</Badge>
          </CardHeader>

          <div className="space-y-4">
            {aiRecommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-xl bg-white dark:bg-slate-850 dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-indigo-300 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{rec.title}</span>
                    <Badge variant={rec.type === 'warning' ? 'warning' : 'success'} size="sm">
                      {rec.impact}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{rec.description}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction(rec.title)}
                  className="shrink-0"
                >
                  {rec.actionLabel}
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Selling Products List */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Top Revenue Products</CardTitle>
              <CardDescription>Highest volume sales items</CardDescription>
            </div>
          </CardHeader>

          <div className="space-y-3">
            {topProducts.map((prod, idx) => (
              <div key={prod.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{prod.name}</p>
                    <p className="text-[11px] text-slate-400">{prod.sales} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{prod.revenue}</p>
                  <span className="text-[10px] font-semibold text-emerald-500">{prod.growth}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
