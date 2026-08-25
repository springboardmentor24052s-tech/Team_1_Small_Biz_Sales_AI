import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, FileText, RefreshCw, Printer } from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';

const HORIZONS = [7, 14, 30];

const REPORTS_BY_ROLE = {
  owner: [
    { id: 'business', label: 'Business Analytics Report' },
    { id: 'revenue', label: 'Revenue Forecast Report' },
  ],
  manager: [
    { id: 'business', label: 'Store Business Analytics Report' },
    { id: 'demand', label: 'Product Demand Forecast Report' },
  ],
  sales: [
    { id: 'personal', label: 'My Sales Forecast Report' },
  ],
  admin: [
    { id: 'business', label: 'Business Analytics Report' },
    { id: 'revenue', label: 'Revenue Forecast Report' },
    { id: 'demand', label: 'Product Demand Forecast Report' },
    { id: 'personal', label: 'Sales Executive Personal Forecast' },
    { id: 'monitoring', label: 'AI Forecasting Monitoring Report' },
  ],
};

const formatNumber = (value, digits = 2) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number)
    ? number.toLocaleString('en-IN', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
    : '—';
};

const formatCurrency = (value) => `₹${formatNumber(value)}`;

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('en-IN');
};

const escapeCsv = (value) => {
  const text = value == null ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
};

const downloadBlob = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const toCsv = (headers, rows) => [
  headers.map(escapeCsv).join(','),
  ...rows.map((row) => row.map(escapeCsv).join(',')),
].join('\n');

const getRoleLabel = (roleId) => ({
  owner: 'Business Owner',
  manager: 'Store Manager',
  sales: 'Sales Executive',
  admin: 'System Administrator',
}[roleId] || 'Authorized User');

const ReportMetric = ({ label, value, detail }) => (
  <div className="rounded-xl border border-slate-700/70 bg-slate-900/50 p-4">
    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
    <p className="mt-2 text-xl font-bold text-slate-100">{value}</p>
    {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
  </div>
);

const Section = ({ title, subtitle, children }) => (
  <section className="space-y-3">
    <div>
      <h3 className="text-sm font-bold text-slate-100">{title}</h3>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
    {children}
  </section>
);

const ForecastLineChart = ({ history = [], series, unit = '', title = 'Actual vs Predicted' }) => {
  const historicalRows = (history || []).map((point) => ({
    date: point.date,
    actual: Number(point.actual),
    predicted: null,
    lower_bound: null,
    upper_bound: null,
  }));
  const forecastRows = (series || []).map((point) => ({
    ...point,
    actual: point.actual == null ? null : Number(point.actual),
    predicted: Number(point.predicted),
    lower_bound: Number(point.lower_bound),
    upper_bound: Number(point.upper_bound),
  }));
  const rows = [...historicalRows, ...forecastRows];

  if (!rows.length) {
    return <p className="py-10 text-center text-xs text-slate-400">No forecast points match these filters.</p>;
  }

  return (
    <div className="h-80 w-full" aria-label={title}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 12, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.45} />
          <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} minTickGap={24} />
          <YAxis stroke="#94a3b8" fontSize={11} width={70} />
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12 }}
            formatter={(value, name) => [formatNumber(value), `${name} ${unit}`.trim()]}
          />
          <Legend />
          {forecastRows[0]?.date && (
            <ReferenceLine
              x={forecastRows[0].date}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              label={{ value: 'Forecast starts', fill: '#f59e0b', fontSize: 11 }}
            />
          )}
          <Line type="monotone" dataKey="actual" name="Recorded actual" stroke="#a855f7" strokeWidth={2} connectNulls={false} />
          <Line type="monotone" dataKey="predicted" name="Model prediction" stroke="#3b82f6" strokeWidth={2} connectNulls={false} />
          <Line type="monotone" dataKey="lower_bound" name="Lower bound" stroke="#64748b" strokeDasharray="4 4" dot={false} />
          <Line type="monotone" dataKey="upper_bound" name="Upper bound" stroke="#64748b" strokeDasharray="4 4" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const dataSourceLabel = (value) => ({
  evaluation_sample_data: 'Evaluation sample data',
  mixed_uploaded_and_sample_data: 'Mixed uploaded + sample data',
  tenant_uploaded_database_records: 'Uploaded business records',
  tenant_database: 'Tenant database records',
}[value] || String(value || 'Source not reported'));

export const ReportsModule = () => {
  const { api, currentRole, access } = useAuth();

  const roleId = currentRole?.id || 'owner';
  const availableReports = REPORTS_BY_ROLE[roleId] || REPORTS_BY_ROLE.owner;

  const [reportType, setReportType] = useState(availableReports[0]?.id || 'business');
  const [horizon, setHorizon] = useState(14);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedAt, setGeneratedAt] = useState(null);
  const [category, setCategory] = useState('ALL');
  const [product, setProduct] = useState('');
  const [filterOptions, setFilterOptions] = useState({ categories: [], products: [] });
  const [adminStores, setAdminStores] = useState([]);
  const [adminSellers, setAdminSellers] = useState([]);
  const [storeId, setStoreId] = useState('');
  const [sellerId, setSellerId] = useState('');
  const forecastAccess = (access?.modules || []).find((module) => module.code === 'forecasts');
  const canExport = forecastAccess?.actions?.includes('export');

  useEffect(() => {
    const allowed = availableReports.some((report) => report.id === reportType);
    if (!allowed) setReportType(availableReports[0]?.id || 'business');
  }, [roleId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (roleId !== 'admin') {
      setAdminStores([]);
      setAdminSellers([]);
      setStoreId('');
      setSellerId('');
      return;
    }
    Promise.all([api('/users/stores/catalog'), api('/users/sellers/catalog')])
      .then(([stores, users]) => {
        const sellers = users.filter((user) => user.role?.code === 'sales_executive');
        setAdminStores(stores);
        setAdminSellers(sellers);
        setStoreId((current) => current || stores[0]?.id || '');
        setSellerId((current) => current || sellers[0]?.id || '');
      })
      .catch(() => {
        setAdminStores([]);
        setAdminSellers([]);
      });
  }, [api, roleId]);

  useEffect(() => {
    const optionType = reportType === 'demand'
      ? 'demand'
      : reportType === 'revenue'
        ? 'revenue'
        : reportType === 'personal'
          ? 'personal'
          : null;
    setCategory('ALL');
    setProduct('');
    setFilterOptions({ categories: [], products: [] });
    if (!optionType) return;
    if (roleId === 'admin' && optionType === 'demand' && !storeId) return;
    if (roleId === 'admin' && optionType === 'personal' && !sellerId) return;
    const params = new URLSearchParams({ forecast_type: optionType });
    if (roleId === 'admin' && optionType === 'demand') params.set('store_id', storeId);
    if (roleId === 'admin' && optionType === 'personal') params.set('seller_id', sellerId);
    api(`/forecasts/options?${params}`)
      .then(setFilterOptions)
      .catch(() => setFilterOptions({ categories: [], products: [] }));
  }, [api, reportType, roleId, sellerId, storeId]);

  const loadReport = async () => {
    setLoading(true);
    setError('');

    try {
      let data;

      if (reportType === 'business') {
        const [customerSummary, segmentSummary] = await Promise.all([
          api('/customers/summary'),
          api('/customer-segments/summary'),
        ]);
        data = { customerSummary, segmentSummary };
      }

      if (reportType === 'revenue') {
        const params = new URLSearchParams({ horizon: String(horizon), category });
        data = await api(`/forecasts/revenue?${params}`);
      }

      if (reportType === 'demand') {
        const params = new URLSearchParams({ horizon: String(horizon) });
        if (roleId === 'admin') {
          if (!storeId) throw new Error('Select a store before generating demand forecasts.');
          params.set('store_id', storeId);
        }
        if (category !== 'ALL') params.set('category', category);
        if (product) params.set('product', product);
        data = await api(`/forecasts/demand?${params}`);
      }

      if (reportType === 'personal') {
        const params = new URLSearchParams({ horizon: String(horizon) });
        if (roleId === 'admin') {
          if (!sellerId) throw new Error('Select a Sales Executive before generating a personal forecast.');
          params.set('seller_id', sellerId);
        }
        data = await api(`/forecasts/personal?${params}`);
      }

      if (reportType === 'monitoring') {
        data = await api('/forecasts/monitoring');
      }

      setReportData(data);
      setGeneratedAt(new Date());
    } catch (err) {
      setReportData(null);
      setError(err?.message || 'Unable to generate the report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roleId === 'admin' && reportType === 'demand' && !storeId) return;
    if (roleId === 'admin' && reportType === 'personal' && !sellerId) return;
    loadReport();
    // Generate the initial report when the role/report type changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, roleId, sellerId, storeId]);

  const reportTitle = useMemo(
    () => availableReports.find((item) => item.id === reportType)?.label || 'Analytics Report',
    [availableReports, reportType],
  );

  const buildDownload = () => {
    if (!reportData) return;

    let headers = [];
    let rows = [];

    if (reportType === 'business') {
      const { customerSummary, segmentSummary } = reportData;

      headers = ['Section', 'Metric', 'Value'];
      rows = [
        ['Customer Analytics', 'Customer Count', customerSummary.customer_count],
        ['Customer Analytics', 'Total Revenue', customerSummary.total_revenue],
        ['Customer Analytics', 'Total Orders', customerSummary.total_orders],
        ['Customer Analytics', 'Average Customer Value', customerSummary.average_customer_value],
        ['Customer Behaviour', 'Segmented Customers', segmentSummary.customer_count],
        ['Customer Behaviour', 'Repeat Customer Rate', segmentSummary.repeat_customer_rate],
        ['Customer Behaviour', 'Average Order Value', segmentSummary.average_order_value],
        ['Customer Behaviour', 'Average Recency Days', segmentSummary.average_recency_days],
        ['Customer Behaviour', 'Average Engagement Score', segmentSummary.average_engagement_score],
        ...(segmentSummary.segments || []).map((segment) => [
          'Customer Segmentation',
          segment.segment_name,
          `${segment.customer_count} customers`,
        ]),
      ];
    }

    if (reportType === 'revenue' || reportType === 'personal') {
      headers = ['Date', 'Actual', 'Predicted', 'Lower Bound', 'Upper Bound'];
      rows = (reportData.series || []).map((point) => [
        point.date,
        point.actual ?? '',
        point.predicted,
        point.lower_bound,
        point.upper_bound,
      ]);
    }

    if (reportType === 'demand') {
      headers = [
        'Source Store',
        'Source Product',
        'Inventory SKU',
        'Mapping Status',
        'Category',
        'Predicted Demand',
        'Available Stock',
        'Stock Risk',
      ];
      rows = (reportData.products || []).map((product) => [
        product.source_store_id,
        product.source_product_id,
        product.product_sku ?? '',
        product.mapping_status,
        product.source_category_id,
        product.predicted_demand,
        product.available_stock ?? '',
        product.stock_risk,
      ]);
    }

    if (reportType === 'monitoring') {
      headers = ['Type', 'Name', 'Status', 'Algorithm', 'Model Version', 'MAE', 'RMSE', 'R²'];
      rows = (reportData.models || []).map((model) => [
        model.forecast_type,
        model.scope,
        model.status,
        model.algorithm,
        model.model_version,
        model.metrics?.mae ?? '',
        model.metrics?.rmse ?? '',
        model.metrics?.r2 ?? '',
      ]);
    }

    const csv = toCsv(headers, rows);
    const safeTitle = reportTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    downloadBlob(
      csv,
      `${safeTitle}-${new Date().toISOString().slice(0, 10)}.csv`,
      'text/csv;charset=utf-8',
    );
  };

  const printReport = () => {
    if (!reportData) return;
    window.print();
  };

  const resetFilters = () => {
    setHorizon(14);
    setCategory('ALL');
    setProduct('');
  };

  const renderBusinessReport = () => {
    const { customerSummary, segmentSummary } = reportData;

    return (
      <>
        <Section title="Customer Analytics" subtitle={`Scope: ${customerSummary.scope}`}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <ReportMetric label="Customers" value={formatNumber(customerSummary.customer_count, 0)} />
            <ReportMetric label="Total Revenue" value={formatCurrency(customerSummary.total_revenue)} />
            <ReportMetric label="Total Orders" value={formatNumber(customerSummary.total_orders, 0)} />
            <ReportMetric label="Avg Customer Value" value={formatCurrency(customerSummary.average_customer_value)} />
            <ReportMetric label="Segmented Customers" value={formatNumber(segmentSummary.customer_count, 0)} />
            <ReportMetric label="Repeat Customer Rate" value={`${formatNumber(segmentSummary.repeat_customer_rate, 1)}%`} />
            <ReportMetric label="Avg Order Value" value={formatCurrency(segmentSummary.average_order_value)} />
            <ReportMetric label="Avg Recency" value={`${formatNumber(segmentSummary.average_recency_days, 1)} days`} />
            <ReportMetric label="Engagement Score" value={formatNumber(segmentSummary.average_engagement_score, 1)} />
          </div>
        </Section>

        <Section
          title="Customer Segmentation"
          subtitle={`Model ${segmentSummary.model_version} • ${segmentSummary.algorithm}`}
        >
          <div className="overflow-x-auto rounded-xl border border-slate-700/70">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400">
                <tr>
                  <th className="px-4 py-3">Segment</th>
                  <th className="px-4 py-3">Customers</th>
                  <th className="px-4 py-3">Customer Share</th>
                  <th className="px-4 py-3">Revenue</th>
                  <th className="px-4 py-3">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {(segmentSummary.segments || []).map((segment) => (
                  <tr key={segment.segment_code} className="border-t border-slate-800 text-slate-200">
                    <td className="px-4 py-3 font-semibold">{segment.segment_name}</td>
                    <td className="px-4 py-3">{formatNumber(segment.customer_count, 0)}</td>
                    <td className="px-4 py-3">{formatNumber(segment.customer_share * 100, 1)}%</td>
                    <td className="px-4 py-3">{formatCurrency(segment.total_revenue)}</td>
                    <td className="px-4 py-3">{formatNumber(segment.average_engagement_score, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </>
    );
  };

  const renderForecastReport = (title, personal = false) => (
    <>
      <Section
        title={title}
        subtitle={`${reportData.forecast_type} • ${reportData.algorithm} • ${reportData.horizon_days}-day horizon`}
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <ReportMetric label="Model Version" value={reportData.model_version} />
          <ReportMetric label="Forecast Horizon" value={`${reportData.horizon_days} days`} />
          <ReportMetric label="Training Data" value={dataSourceLabel(reportData.data_source)} />
          <ReportMetric label="Quality" value={reportData.quality_status} />
          <ReportMetric label="MAE" value={formatNumber(reportData.metrics?.mae, 3)} />
          <ReportMetric label="RMSE" value={formatNumber(reportData.metrics?.rmse, 3)} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-700/70 bg-slate-900/40 p-4 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-100">Actual vs Predicted</h4>
                <p className="text-xs text-slate-400">
                  {personal ? 'Authorized personal sales scope' : `Target: ${reportData.target}`}
                </p>
              </div>
              <Badge variant="info">{reportData.unit}</Badge>
            </div>

            <ForecastLineChart
              history={reportData.history}
              series={reportData.series}
              unit={reportData.unit}
              title={personal ? 'Personal sales actual versus predicted' : 'Revenue actual versus predicted'}
            />

            <div className="mt-4 max-h-80 overflow-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Actual</th>
                    <th className="px-3 py-2">Predicted</th>
                    <th className="px-3 py-2">Lower</th>
                    <th className="px-3 py-2">Upper</th>
                  </tr>
                </thead>
                <tbody>
                  {(reportData.series || []).map((point) => (
                    <tr key={point.date} className="border-t border-slate-800 text-slate-200">
                      <td className="px-3 py-2">{formatDate(point.date)}</td>
                      <td className="px-3 py-2">{point.actual == null ? '—' : formatNumber(point.actual)}</td>
                      <td className="px-3 py-2 font-semibold">{formatNumber(point.predicted)}</td>
                      <td className="px-3 py-2">{formatNumber(point.lower_bound)}</td>
                      <td className="px-3 py-2">{formatNumber(point.upper_bound)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700/70 bg-slate-900/40 p-4">
            <h4 className="text-sm font-semibold text-slate-100">Forecast Insights</h4>
            <div className="mt-3 space-y-3">
              {(reportData.insights || []).map((insight) => (
                <div key={insight} className="rounded-lg bg-indigo-500/10 p-3 text-xs text-slate-300">
                  {insight}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Model Comparison" subtitle="Chronological evaluation metrics returned by the forecasting service.">
        <div className="overflow-x-auto rounded-xl border border-slate-700/70">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400">
              <tr>
                <th className="px-4 py-3">Algorithm</th>
                <th className="px-4 py-3">MAE</th>
                <th className="px-4 py-3">RMSE</th>
                <th className="px-4 py-3">Bias</th>
                <th className="px-4 py-3">R²</th>
              </tr>
            </thead>
            <tbody>
              {(reportData.model_comparison || []).map((model) => (
                <tr key={model.algorithm} className="border-t border-slate-800 text-slate-200">
                  <td className={`px-4 py-3 font-semibold ${model.algorithm === reportData.algorithm ? 'text-indigo-300' : ''}`}>
                    {model.algorithm}
                    {model.algorithm === reportData.algorithm && (
                      <span className="ml-2 rounded-full bg-indigo-500/15 px-2 py-1 text-[10px] text-indigo-300">
                        Selected
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatNumber(model.mae, 3)}</td>
                  <td className="px-4 py-3">{formatNumber(model.rmse, 3)}</td>
                  <td className="px-4 py-3">{formatNumber(model.bias, 3)}</td>
                  <td className="px-4 py-3">{formatNumber(model.r2, 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );

  const renderDemandReport = () => (
    <>
      <Section
        title="Product Demand Forecast"
        subtitle={`${reportData.total_products} products • ${reportData.horizon_days}-day horizon • Target: ${reportData.target}`}
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <ReportMetric label="Products Forecasted" value={formatNumber(reportData.total_products, 0)} />
          <ReportMetric label="Increasing Demand" value={formatNumber(reportData.increasing_demand, 0)} />
          <ReportMetric label="Decreasing Demand" value={formatNumber(reportData.decreasing_demand, 0)} />
          <ReportMetric label="Potential Stock Risk" value={formatNumber(reportData.potential_stock_risk, 0)} />
          <ReportMetric label="Training Data" value={dataSourceLabel(reportData.data_source)} />
          <ReportMetric label="Quality" value={reportData.quality_status} />
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-700/70">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400">
              <tr>
                <th className="px-4 py-3">Source Store</th>
                <th className="px-4 py-3">Source Product</th>
                <th className="px-4 py-3">Inventory Mapping</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Predicted Demand</th>
                <th className="px-4 py-3">Available Stock</th>
                <th className="px-4 py-3">Risk</th>
              </tr>
            </thead>
            <tbody>
              {(reportData.products || []).map((product) => (
                <tr
                  key={`${product.source_store_id}-${product.source_product_id}`}
                  className="border-t border-slate-800 text-slate-200"
                >
                  <td className="px-4 py-3">{product.source_store_id}</td>
                  <td className="px-4 py-3 font-semibold">{product.source_product_id}</td>
                  <td className="px-4 py-3">
                    {product.mapping_status === 'mapped' ? (
                      <div>
                        <p className="font-semibold text-emerald-300">{product.product_sku}</p>
                        <p className="text-[11px] text-slate-500">{product.product_name}</p>
                      </div>
                    ) : (
                      <Badge variant="warning">Unmapped</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">{product.source_category_id}</td>
                  <td className="px-4 py-3">{formatNumber(product.predicted_demand)}</td>
                  <td className="px-4 py-3">{product.available_stock ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={product.stock_risk === 'high' ? 'danger' : product.stock_risk === 'medium' ? 'warning' : 'success'}>
                      {product.stock_risk || 'unknown'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(reportData.products || []).length > 0 && (
          <div className="rounded-xl border border-slate-700/70 bg-slate-900/40 p-4">
            <h4 className="text-sm font-semibold text-slate-100">
              Product {reportData.products[0].source_product_id} demand trend
            </h4>
            <p className="mb-3 text-xs text-slate-400">
              Purple is recorded product demand. Blue begins after the forecast date and is the model prediction.
            </p>
            <ForecastLineChart
              history={reportData.products[0].history}
              series={reportData.products[0].series}
              unit={reportData.unit}
              title="Product demand actual versus predicted"
            />
          </div>
        )}
      </Section>

      <Section title="Demand Model Performance" subtitle={`Selected algorithm: ${reportData.algorithm}`}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <ReportMetric label="Model Version" value={reportData.model_version} />
          <ReportMetric label="MAE" value={formatNumber(reportData.metrics?.mae, 3)} />
          <ReportMetric label="RMSE" value={formatNumber(reportData.metrics?.rmse, 3)} />
          <ReportMetric label="R²" value={formatNumber(reportData.metrics?.r2, 3)} />
        </div>
      </Section>

      <Section title="Demand Insights">
        <div className="grid gap-3 lg:grid-cols-2">
          {(reportData.insights || []).map((insight) => (
            <div key={insight} className="rounded-xl border border-slate-700/70 bg-slate-900/40 p-4 text-sm text-slate-300">
              {insight}
            </div>
          ))}
        </div>
      </Section>
    </>
  );

  const renderMonitoringReport = () => (
    <>
      <Section title="Forecasting Engine Status" subtitle="Infrastructure and model monitoring only; no business decision data is exposed.">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <ReportMetric label="Engine" value={reportData.engine_status} />
          <ReportMetric label="API" value={reportData.api_status} />
          <ReportMetric label="Current Model" value={reportData.current_model || '—'} />
          <ReportMetric label="Model Version" value={reportData.model_version || '—'} />
          <ReportMetric label="Successful Jobs" value={formatNumber(reportData.successful_jobs, 0)} />
          <ReportMetric label="Failed Jobs" value={formatNumber(reportData.failed_jobs, 0)} />
          <ReportMetric label="Supported Horizons" value={reportData.supported_horizons.join(' / ')} />
          <ReportMetric label="Last Forecast" value={formatDate(reportData.last_forecast_generated)} />
        </div>
      </Section>

      <Section title="Model Registry & Performance">
        <div className="overflow-x-auto rounded-xl border border-slate-700/70">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Scope</th>
                <th className="px-4 py-3">Algorithm</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">MAE</th>
                <th className="px-4 py-3">RMSE</th>
                <th className="px-4 py-3">R²</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(reportData.models || []).map((model) => (
                <tr key={`${model.model_version}-${model.forecast_type}-${model.scope}`} className="border-t border-slate-800 text-slate-200">
                  <td className="px-4 py-3">{model.forecast_type}</td>
                  <td className="px-4 py-3">{model.scope}</td>
                  <td className="px-4 py-3 font-semibold">{model.algorithm}</td>
                  <td className="px-4 py-3">{model.model_version}</td>
                  <td className="px-4 py-3">{formatNumber(model.metrics?.mae, 3)}</td>
                  <td className="px-4 py-3">{formatNumber(model.metrics?.rmse, 3)}</td>
                  <td className="px-4 py-3">{formatNumber(model.metrics?.r2, 3)}</td>
                  <td className="px-4 py-3"><Badge variant="success">{model.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Recent Forecast Jobs">
        <div className="overflow-x-auto rounded-xl border border-slate-700/70">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Records</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">Completed</th>
              </tr>
            </thead>
            <tbody>
              {(reportData.recent_jobs || []).map((job) => (
                <tr key={job.reference} className="border-t border-slate-800 text-slate-200">
                  <td className="px-4 py-3 font-mono">{job.reference}</td>
                  <td className="px-4 py-3">{job.job_type}</td>
                  <td className="px-4 py-3"><Badge variant="success">{job.status}</Badge></td>
                  <td className="px-4 py-3">{formatNumber(job.record_count, 0)}</td>
                  <td className="px-4 py-3">{formatDate(job.started_at)}</td>
                  <td className="px-4 py-3">{formatDate(job.completed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );

  return (
    <div className="reports-page space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-400" />
            <h2 className="text-2xl font-bold text-slate-100">Reports & Business Analytics</h2>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Generate database-backed analytics and forecasting reports for the {getRoleLabel(roleId)} role.
          </p>
        </div>

        <Badge variant="info">Milestone 2 • Live API Data</Badge>
      </div>

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Report
            </label>
            <select
              value={reportType}
              onChange={(event) => setReportType(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-500"
            >
              {availableReports.map((report) => (
                <option key={report.id} value={report.id}>{report.label}</option>
              ))}
            </select>
          </div>

          {(reportType === 'revenue' || reportType === 'demand' || reportType === 'personal') && (
            <div className="w-full lg:w-48">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Forecast Horizon
              </label>
              <select
                value={horizon}
                onChange={(event) => setHorizon(Number(event.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-500"
              >
                {HORIZONS.map((value) => (
                  <option key={value} value={value}>{value} Days</option>
                ))}
              </select>
            </div>
          )}

          {(reportType === 'revenue' || reportType === 'demand') && (
            <div className="w-full lg:w-52">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Category
              </label>
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setProduct('');
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-500"
              >
                <option value="ALL">All categories</option>
                {(filterOptions.categories || []).map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'demand' && (
            <div className="w-full lg:w-52">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Product / SKU
              </label>
              <select
                value={product}
                onChange={(event) => setProduct(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-500"
              >
                <option value="">All products</option>
                {(filterOptions.products || [])
                  .filter((item) => category === 'ALL' || item.category === category)
                  .map((item) => (
                    <option key={`${item.category}-${item.product}`} value={item.product}>
                      {item.product}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {roleId === 'admin' && reportType === 'demand' && (
            <div className="w-full lg:w-52">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Application Store
              </label>
              <select
                value={storeId}
                onChange={(event) => setStoreId(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-500"
              >
                {adminStores.map((store) => (
                  <option key={store.id} value={store.id}>{store.name} ({store.code})</option>
                ))}
              </select>
            </div>
          )}

          {roleId === 'admin' && reportType === 'personal' && (
            <div className="w-full lg:w-64">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Sales Executive
              </label>
              <select
                value={sellerId}
                onChange={(event) => setSellerId(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-500"
              >
                {adminSellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>{seller.full_name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={loadReport} disabled={loading} icon={RefreshCw}>
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>

            <Button variant="secondary" onClick={resetFilters} disabled={loading}>
              Reset
            </Button>

            {canExport && (
              <>
                <Button variant="outline" onClick={buildDownload} disabled={!reportData || loading} icon={Download}>
                  Download CSV
                </Button>

                <Button variant="outline" onClick={printReport} disabled={!reportData || loading} icon={Printer}>
                  Print / PDF
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <strong>Report generation failed:</strong> {error}
        </div>
      )}

      {reportData && !loading && (
        <div className="report-printable space-y-6">
          <Card>
            <div className="flex flex-col gap-2 border-b border-slate-800 pb-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">MarketMind AI</p>
                <h3 className="mt-1 text-xl font-bold text-slate-100">{reportTitle}</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Generated {generatedAt ? generatedAt.toLocaleString('en-IN') : '—'}
                </p>
              </div>
              <Badge variant="success">Database-backed</Badge>
            </div>
          </Card>

          {reportType === 'business' && renderBusinessReport()}
          {reportType === 'revenue' && renderForecastReport('Revenue Forecast', false)}
          {reportType === 'personal' && renderForecastReport('Personal Sales Forecast', true)}
          {reportType === 'demand' && renderDemandReport()}
          {reportType === 'monitoring' && renderMonitoringReport()}
        </div>
      )}

      {!reportData && !loading && !error && (
        <Card>
          <div className="flex min-h-48 flex-col items-center justify-center text-center">
            <FileText className="h-10 w-10 text-slate-600" />
            <h3 className="mt-3 text-sm font-semibold text-slate-200">No report generated yet</h3>
            <p className="mt-1 max-w-md text-xs text-slate-400">
              Select a report and generate it using the authenticated Milestone 2 APIs.
            </p>
          </div>
        </Card>
      )}

      <style>{`
        @media print {
          body {
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          .report-printable,
          .report-printable * {
            visibility: visible !important;
          }

          .report-printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 24px;
            color: #0f172a !important;
            background: white !important;
          }

          .report-printable .rounded-xl,
          .report-printable .rounded-lg {
            border-color: #cbd5e1 !important;
            background: white !important;
          }

          .report-printable h2,
          .report-printable h3,
          .report-printable h4,
          .report-printable p,
          .report-printable td,
          .report-printable th {
            color: #0f172a !important;
          }
        }
      `}</style>
    </div>
  );
};
