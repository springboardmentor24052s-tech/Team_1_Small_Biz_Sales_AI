import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import {
  Sparkles,
  TrendingUp,
  Target,
  Activity,
  Brain,
  CalendarDays,
  Store,
  Layers,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const forecastData = [
  { date: 'May 01', actual: 42000, predicted: 41500 },
  { date: 'May 05', actual: 45500, predicted: 44800 },
  { date: 'May 09', actual: 47000, predicted: 47800 },
  { date: 'May 13', actual: 51000, predicted: 50200 },
  { date: 'May 17', actual: 49500, predicted: 51400 },
  { date: 'May 21', actual: 54000, predicted: 53200 },
  { date: 'May 25', actual: 56500, predicted: 55800 },
  { date: 'May 29', actual: 59000, predicted: 58100 },
  { date: 'Jun 01', actual: null, predicted: 60500 },
  { date: 'Jun 05', actual: null, predicted: 62400 },
  { date: 'Jun 09', actual: null, predicted: 64100 },
  { date: 'Jun 13', actual: null, predicted: 66300 }
];

const forecastResults = [
  { date: 'Jun 01', predictedRevenue: '₹60,500', lowerBound: '₹57,900', upperBound: '₹63,100' },
  { date: 'Jun 02', predictedRevenue: '₹61,100', lowerBound: '₹58,300', upperBound: '₹63,900' },
  { date: 'Jun 03', predictedRevenue: '₹61,700', lowerBound: '₹58,700', upperBound: '₹64,700' },
  { date: 'Jun 04', predictedRevenue: '₹62,000', lowerBound: '₹58,900', upperBound: '₹65,100' },
  { date: 'Jun 05', predictedRevenue: '₹62,400', lowerBound: '₹59,200', upperBound: '₹65,600' }
];

export const AIForecasting = () => {
  const { addToast } = useToast();

  const [forecastHorizon, setForecastHorizon] = useState('14 Days');
  const [store, setStore] = useState('All Stores');
  const [category, setCategory] = useState('All Categories');
  const [forecastType, setForecastType] = useState('Revenue Forecast');

  const handleGenerateForecast = () => {
    addToast(
      `Generating ${forecastType.toLowerCase()} for ${forecastHorizon.toLowerCase()}...`,
      'success'
    );
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
            <Sparkles className="w-5 h-5" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              AI Sales and Revenue Forecasting
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Predict future revenue, sales trends, and business growth using machine learning.
            </p>
          </div>
        </div>
      </div>

      {/* Forecast Configuration */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Forecast Configuration</CardTitle>
            <CardDescription>
              Configure the parameters used to generate the forecast.
            </CardDescription>
          </div>

          <Badge variant="info">AI Forecast</Badge>
        </CardHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

          {/* Forecast Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Forecast Type
            </label>

            <div className="relative">
              <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <select
                value={forecastType}
                onChange={(e) => setForecastType(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option>Revenue Forecast</option>
              </select>
            </div>
          </div>

          {/* Forecast Horizon */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Forecast Horizon
            </label>

            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <select
                value={forecastHorizon}
                onChange={(e) => setForecastHorizon(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option>7 Days</option>
                <option>14 Days</option>
                <option>30 Days</option>
                <option>60 Days</option>
                <option>90 Days</option>
              </select>
            </div>
          </div>

          {/* Store */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Store
            </label>

            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <select
                value={store}
                onChange={(e) => setStore(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option>All Stores</option>
                <option>Store 1</option>
                <option>Store 2</option>
                <option>Store 3</option>
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Category
            </label>

            <div className="relative">
              <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option>All Categories</option>
                <option>Electronics</option>
                <option>Clothing</option>
                <option>Home</option>
                <option>Accessories</option>
              </select>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Date Range
            </label>

            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200">
              <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
              <span>May 1, 2025</span>
              <span className="text-slate-400">→</span>
              <span>May 31, 2025</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            onClick={handleGenerateForecast}
            icon={RefreshCw}
          >
            Generate Forecast
          </Button>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Current Revenue
            </span>

            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <h3 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
            ₹58,400
          </h3>

          <p className="text-xs text-slate-400 mt-1">
            Current period
          </p>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Forecasting Revenue
            </span>

            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Target className="w-5 h-5" />
            </div>
          </div>

          <h3 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
            ₹87,650
          </h3>

          <p className="text-xs text-emerald-500 mt-1 font-semibold">
            Next {forecastHorizon.toLowerCase()}
          </p>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Expected Revenue Growth
            </span>

            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <h3 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
            +12.8%
          </h3>

          <p className="text-xs text-emerald-500 mt-1 font-semibold">
            Positive growth expected
          </p>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Forecast Accuracy
            </span>

            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <h3 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
            94.2%
          </h3>

          <p className="text-xs text-slate-400 mt-1">
            Model confidence
          </p>
        </Card>
      </div>

      {/* Actual vs Predicted Revenue + AI Business Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Actual vs Predicted Revenue</CardTitle>
              <CardDescription>
                Historical revenue compared with AI-generated predictions
              </CardDescription>
            </div>

            <Badge variant="success">Forecast Active</Badge>
          </CardHeader>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />

                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={11}
                />

                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(value) => `₹${value / 1000}k`}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                  formatter={(value) =>
                    value == null
                      ? ['-', '']
                      : [`₹${Number(value).toLocaleString('en-IN')}`, '']
                  }
                />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  name="Actual Revenue"
                  connectNulls={false}
                />

                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#10b981"
                  strokeWidth={3}
                  strokeDasharray="6 4"
                  dot={{ r: 3 }}
                  name="Predicted Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* AI Business Insights */}
        <Card className="border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/30 dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-600 text-white">
                <Brain className="w-5 h-5" />
              </div>

              <div>
                <CardTitle>AI Business Insights</CardTitle>
                <CardDescription>
                  Forecast-based observations
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <div className="space-y-4">

            <div className="p-3 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Revenue growth expected
              </p>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Revenue is projected to increase by approximately 12.8% during the forecast period.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Positive sales trend
              </p>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Recent sales momentum indicates continued growth in the upcoming period.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Forecast confidence is high
              </p>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                The selected model currently reports a 94.2% forecast accuracy.
              </p>
            </div>

          </div>
        </Card>
      </div>

      {/* Model Performance + Model Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Model Performance */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Model Performance</CardTitle>
              <CardDescription>
                Current forecasting model evaluation
              </CardDescription>
            </div>
          </CardHeader>

          <div className="space-y-4">

            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  Forecast Accuracy
                </span>
                <span className="font-bold text-emerald-500">
                  94.2%
                </span>
              </div>

              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full w-[94.2%] bg-emerald-500 rounded-full" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <p className="text-[10px] uppercase font-semibold text-slate-400">
                  MAE
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                  ₹2,140
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <p className="text-[10px] uppercase font-semibold text-slate-400">
                  RMSE
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                  ₹3,280
                </p>
              </div>

            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Activity className="w-4 h-4 text-indigo-500" />
              Model status: <span className="font-semibold text-emerald-500">Good</span>
            </div>

          </div>
        </Card>

        {/* Model Comparison */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Model Comparison</CardTitle>
              <CardDescription>
                Performance of available forecasting models
              </CardDescription>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-3 text-xs font-semibold text-slate-500">
                    Model
                  </th>
                  <th className="py-3 px-3 text-xs font-semibold text-slate-500">
                    Accuracy
                  </th>
                  <th className="py-3 px-3 text-xs font-semibold text-slate-500">
                    MAE
                  </th>
                  <th className="py-3 px-3 text-xs font-semibold text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr className="border-b border-slate-100 dark:border-slate-800/70">
                  <td className="py-3 px-3 text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Random Forest
                  </td>
                  <td className="py-3 px-3 text-xs">94.2%</td>
                  <td className="py-3 px-3 text-xs">₹2,140</td>
                  <td className="py-3 px-3">
                    <Badge variant="success" size="sm">
                      Selected
                    </Badge>
                  </td>
                </tr>

                <tr className="border-b border-slate-100 dark:border-slate-800/70">
                  <td className="py-3 px-3 text-xs font-semibold text-slate-900 dark:text-slate-100">
                    XGBoost
                  </td>
                  <td className="py-3 px-3 text-xs">92.8%</td>
                  <td className="py-3 px-3 text-xs">₹2,480</td>
                  <td className="py-3 px-3">
                    <Badge variant="info" size="sm">
                      Available
                    </Badge>
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-3 text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Linear Regression
                  </td>
                  <td className="py-3 px-3 text-xs">87.6%</td>
                  <td className="py-3 px-3 text-xs">₹3,420</td>
                  <td className="py-3 px-3">
                    <Badge size="sm">
                      Baseline
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Revenue Forecast Result */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Revenue Forecast Result</CardTitle>
            <CardDescription>
              {forecastHorizon} forecast based on the selected parameters
            </CardDescription>
          </div>

          <Badge variant="success">{forecastHorizon} Forecast</Badge>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-3 text-xs font-semibold text-slate-500">
                  Forecast Date
                </th>
                <th className="py-3 px-3 text-xs font-semibold text-slate-500">
                  Predicted Revenue
                </th>
                <th className="py-3 px-3 text-xs font-semibold text-slate-500">
                  Lower Bound
                </th>
                <th className="py-3 px-3 text-xs font-semibold text-slate-500">
                  Upper Bound
                </th>
              </tr>
            </thead>

            <tbody>
              {forecastResults.map((row) => (
                <tr
                  key={row.date}
                  className="border-b border-slate-100 dark:border-slate-800/70 last:border-0"
                >
                  <td className="py-3 px-3 text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {row.date}
                  </td>

                  <td className="py-3 px-3 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {row.predictedRevenue}
                  </td>

                  <td className="py-3 px-3 text-xs text-slate-500 dark:text-slate-400">
                    {row.lowerBound}
                  </td>

                  <td className="py-3 px-3 text-xs text-slate-500 dark:text-slate-400">
                    {row.upperBound}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Forecast Details + About This Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Forecast Details */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Forecast Details</CardTitle>
              <CardDescription>
                Parameters used for this forecast
              </CardDescription>
            </div>
          </CardHeader>

          <div className="grid grid-cols-2 gap-3">

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <p className="text-[10px] uppercase font-semibold text-slate-400">
                Forecast Type
              </p>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">
                {forecastType}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <p className="text-[10px] uppercase font-semibold text-slate-400">
                Horizon
              </p>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">
                {forecastHorizon}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <p className="text-[10px] uppercase font-semibold text-slate-400">
                Store
              </p>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">
                {store}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <p className="text-[10px] uppercase font-semibold text-slate-400">
                Category
              </p>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">
                {category}
              </p>
            </div>

          </div>
        </Card>

        {/* About This Forecast */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>About This Forecast</CardTitle>
              <CardDescription>
                How the prediction should be interpreted
              </CardDescription>
            </div>
          </CardHeader>

          <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
            This forecast uses historical sales and revenue patterns to estimate
            future business performance. Predicted values are estimates and may
            change when new sales data becomes available.
          </p>
        </Card>

      </div>
    </div>
  );
};