import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Brain,
  CalendarDays,
  Store,
  Package,
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

const demandData = [
  { date: 'May 01', demand: 42 },
  { date: 'May 05', demand: 48 },
  { date: 'May 09', demand: 55 },
  { date: 'May 13', demand: 51 },
  { date: 'May 17', demand: 63 },
  { date: 'May 21', demand: 70 },
  { date: 'May 25', demand: 76 },
  { date: 'May 29', demand: 82 },
  { date: 'Jun 02', demand: 88 },
  { date: 'Jun 06', demand: 91 },
  { date: 'Jun 10', demand: 96 }
];

const demandResults = [
  { date: 'Jun 01', predictedDemand: 84, lowerBound: 76, upperBound: 92 },
  { date: 'Jun 02', predictedDemand: 88, lowerBound: 80, upperBound: 96 },
  { date: 'Jun 03', predictedDemand: 90, lowerBound: 82, upperBound: 98 },
  { date: 'Jun 04', predictedDemand: 93, lowerBound: 85, upperBound: 101 },
  { date: 'Jun 05', predictedDemand: 95, lowerBound: 87, upperBound: 103 }
];

export const AIDemandForecasting = () => {
  const { addToast } = useToast();

  const [forecastHorizon, setForecastHorizon] = useState('14 Days');
  const [store, setStore] = useState('All Stores');
  const [product, setProduct] = useState('All Products');
  const [category, setCategory] = useState('All Categories');
  const [forecastType, setForecastType] = useState('Product Demand Forecast');
  const [demandTarget, setDemandTarget] = useState('Sale Amount');
  const [apiOutput, setApiOutput] = useState('Predicted Demand');
  const [chartView, setChartView] = useState('Daily');

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
              AI Demand Forecasting
            </h1>

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Predict product demand and identify potential stock risk before they occur.
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
              Configure the parameters used to generate the demand forecast.
            </CardDescription>
          </div>

          <Badge variant="info">AI Forecast</Badge>
        </CardHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

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
                <option>Product Demand Forecast</option>
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
                <option>Store 12</option>
                <option>Store 15</option>
                <option>Store 21</option>
              </select>
            </div>
          </div>

          {/* Product / SKU */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Product / SKU
            </label>

            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <select
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option>All Products</option>
                <option>SKU-001 - Smartphone X</option>
                <option>SKU-002 - Laptop Pro</option>
                <option>SKU-003 - Wireless Headphones</option>
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

          {/* Demand Target */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Demand Target
            </label>

            <select
              value={demandTarget}
              onChange={(e) => setDemandTarget(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option>Sale Amount</option>
              <option>Quantity Sold</option>
              <option>Units Ordered</option>
            </select>
          </div>

          {/* API Output */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              API Output
            </label>

            <select
              value={apiOutput}
              onChange={(e) => setApiOutput(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option>Predicted Demand</option>
              <option>Predicted Quantity</option>
              <option>Demand Probability</option>
            </select>
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
              Total Products Forecasted
            </span>

            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <h3 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
            128
          </h3>

          <p className="text-xs text-slate-400 mt-1">
            Products analyzed
          </p>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Increasing Demand
            </span>

            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <h3 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
            74
          </h3>

          <p className="text-xs text-emerald-500 mt-1 font-semibold">
            Demand trending upward
          </p>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Decreasing Demand
            </span>

            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>

          <h3 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
            32
          </h3>

          <p className="text-xs text-slate-400 mt-1">
            Demand trending downward
          </p>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Potential Stock Risk
            </span>

            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <h3 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
            12
          </h3>

          <p className="text-xs text-rose-500 mt-1 font-semibold">
            Requires attention
          </p>
        </Card>
      </div>

      {/* Forecast Chart + Stock Risk Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Product Demand Forecast */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Product Demand Forecast</CardTitle>

              <CardDescription>
                Selected Product: SKU-001 - Smartphone X • Store 12
              </CardDescription>
            </div>

            <select
              value={chartView}
              onChange={(e) => setChartView(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </CardHeader>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={demandData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  opacity={0.2}
                />

                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={11}
                />

                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                  label={{
                    value: 'Demand Units',
                    angle: -90,
                    position: 'insideLeft'
                  }}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                  formatter={(value) => [`${value} units`, 'Demand']}
                />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="demand"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  name="Predicted Demand"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Stock Risk Alerts */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Stock Risk Alerts</CardTitle>

              <CardDescription>
                Products requiring attention
              </CardDescription>
            </div>

            <Badge variant="warning">12 Risks</Badge>
          </CardHeader>

          <div className="space-y-3">

            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  SKU-001
                </p>

                <Badge variant="danger" size="sm">
                  High
                </Badge>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Smartphone X may face stock shortage within 7 days.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  SKU-014
                </p>

                <Badge variant="warning" size="sm">
                  Medium
                </Badge>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Demand is increasing faster than current stock levels.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  SKU-027
                </p>

                <Badge variant="warning" size="sm">
                  Medium
                </Badge>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Forecast indicates possible inventory pressure.
              </p>
            </div>

            <button className="w-full text-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline pt-1">
              View Full Report
            </button>
          </div>
        </Card>
      </div>

      {/* Product Demand Forecast Table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Product Demand Forecast</CardTitle>
            <CardDescription>
              Forecasted demand for the selected product.
            </CardDescription>
          </div>

          <Badge variant="info">{forecastHorizon}</Badge>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-3 text-xs font-semibold text-slate-500">
                  Date
                </th>
                <th className="py-3 px-3 text-xs font-semibold text-slate-500">
                  Predicted Demand
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
              {demandResults.map((item) => (
                <tr
                  key={item.date}
                  className="border-b border-slate-100 dark:border-slate-800/70"
                >
                  <td className="py-3 px-3 text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {item.date}
                  </td>

                  <td className="py-3 px-3 text-xs">
                    {item.predictedDemand} units
                  </td>

                  <td className="py-3 px-3 text-xs text-slate-500">
                    {item.lowerBound} units
                  </td>

                  <td className="py-3 px-3 text-xs text-slate-500">
                    {item.upperBound} units
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Model Performance + Model Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Model Performance */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Model Performance</CardTitle>

              <CardDescription>
                Current demand forecasting model evaluation
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
                  93.6%
                </span>
              </div>

              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full w-[93.6%] bg-emerald-500 rounded-full" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <p className="text-[10px] uppercase font-semibold text-slate-400">
                  MAE
                </p>

                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                  4.2
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <p className="text-[10px] uppercase font-semibold text-slate-400">
                  RMSE
                </p>

                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                  6.8
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Activity className="w-4 h-4 text-indigo-500" />
              Model status:
              <span className="font-semibold text-emerald-500">
                Good
              </span>
            </div>
          </div>
        </Card>

        {/* Model Comparison */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Model Comparison</CardTitle>

              <CardDescription>
                Performance of available demand forecasting models
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

                  <td className="py-3 px-3 text-xs">
                    93.6%
                  </td>

                  <td className="py-3 px-3 text-xs">
                    4.2
                  </td>

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

                  <td className="py-3 px-3 text-xs">
                    91.8%
                  </td>

                  <td className="py-3 px-3 text-xs">
                    4.8
                  </td>

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

                  <td className="py-3 px-3 text-xs">
                    86.9%
                  </td>

                  <td className="py-3 px-3 text-xs">
                    6.1
                  </td>

                  <td className="py-3 px-3">
                    <Badge variant="info" size="sm">
                      Available
                    </Badge>
                  </td>
                </tr>

              </tbody>
            </table>
          </div>
        </Card>
      </div>

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
                Demand and inventory forecast-based observations
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="p-4 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Demand is increasing
            </p>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Several products are showing an upward demand trend during the forecast period.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Stock risk detected
            </p>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Some products may experience stock pressure if the current demand trend continues.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Forecast confidence is high
            </p>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              The selected model currently reports 93.6% forecast accuracy.
            </p>
          </div>

        </div>
      </Card>

    </div>
  );
};