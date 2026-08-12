import React, { useEffect, useMemo, useState } from 'react';
import { Download, Eye, RefreshCw, Search, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';

const money = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(Number(value || 0));

const number = (value, digits = 1) => Number(value || 0).toLocaleString('en-IN', {
  maximumFractionDigits: digits,
});

const csvValue = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

export const CustomersModule = () => {
  const { api, access } = useAuth();
  const { customerSegmentSummary: summary, isLoading: sharedLoading, refresh } = useData();
  const segmentAccess = (access?.modules || []).find((module) => module.code === 'customer_segments');
  const canList = segmentAccess?.access !== 'summary';
  const canExport = segmentAccess?.actions?.includes('export');

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('ALL');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const limit = 50;

  useEffect(() => {
    if (!canList) {
      setItems([]);
      setTotal(0);
      return undefined;
    }
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) });
      if (search.trim()) params.set('search', search.trim());
      if (segment !== 'ALL') params.set('segment_code', segment);
      try {
        const result = await api(`/customer-segments?${params}`);
        setItems(result.items || []);
        setTotal(result.total || 0);
      } catch (requestError) {
        setItems([]);
        setTotal(0);
        setError(requestError.message || 'Unable to load customer segments.');
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [api, canList, page, search, segment]);

  useEffect(() => setPage(0), [search, segment]);

  const segmentOptions = useMemo(() => summary?.segments || [], [summary]);
  const pageCount = Math.max(1, Math.ceil(total / limit));

  const exportCsv = () => {
    const headers = [
      'Customer ID', 'Segment', 'Engagement Score', 'Recency Days', 'Orders',
      'Total Revenue', 'Average Order Value', 'Basket Size', 'Product Variety', 'Return Rate',
    ];
    const rows = items.map((item) => [
      item.external_customer_id,
      item.segment_name,
      item.engagement_score,
      item.recency_days,
      item.order_count,
      item.total_revenue,
      item.average_order_value,
      item.average_basket_size,
      item.product_variety,
      item.return_rate,
    ]);
    const blob = new Blob([
      [headers, ...rows].map((row) => row.map(csvValue).join(',')).join('\n'),
    ], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `customer-segments-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            <Users className="h-6 w-6 text-indigo-500" />
            Customer Segmentation & Behaviour
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Database-backed customer groups built from purchasing behaviour and engagement features.
          </p>
          {summary && (
            <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">
              {summary.scope.replaceAll('_', ' ')} scope • model {summary.model_version} • trained{' '}
              {new Date(summary.trained_at).toLocaleDateString('en-IN')}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => refresh()} disabled={sharedLoading || loading}>
            Refresh
          </Button>
          {canExport && (
            <Button size="sm" icon={Download} onClick={exportCsv} disabled={!items.length}>
              Export page
            </Button>
          )}
        </div>
      </div>

      {summary ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ['Customers', number(summary.customer_count, 0)],
              ['Segment revenue', money(summary.total_revenue)],
              ['Repeat rate', `${number(summary.repeat_customer_rate)}%`],
              ['Average order value', money(summary.average_order_value)],
              ['Average recency', `${number(summary.average_recency_days)} days`],
              ['Engagement score', number(summary.average_engagement_score)],
              ['Silhouette score', number(summary.silhouette_score, 3)],
              ['Algorithm', summary.algorithm],
            ].map(([label, value]) => (
              <Card key={label} hoverEffect={false} className="p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
                <p className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
              </Card>
            ))}
          </div>

          <Card hoverEffect={false}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Segment profiles</h3>
            <p className="mt-1 text-xs text-slate-500">Profiles describe observed customer behaviour; they are not individual predictions.</p>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {segmentOptions.map((profile) => (
                <button
                  key={profile.segment_code}
                  onClick={() => canList && setSegment(profile.segment_code)}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-900/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{profile.segment_name}</p>
                    <Badge variant="info">{number(profile.customer_count, 0)}</Badge>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    {number(profile.customer_share * 100)}% of customers • {money(profile.total_revenue)} revenue
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Engagement {number(profile.average_engagement_score)} • recency {number(profile.average_recency_days)} days
                  </p>
                </button>
              ))}
            </div>
          </Card>
        </>
      ) : (
        <Card hoverEffect={false}>
          <p className="text-sm text-slate-500">
            {sharedLoading ? 'Loading segmentation model…' : 'No segmentation model has been imported for this tenant.'}
          </p>
        </Card>
      )}

      {canList ? (
        <Card hoverEffect={false}>
          <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search customer ID"
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 py-2 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <select
                value={segment}
                onChange={(event) => setSegment(event.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="ALL">All segments</option>
                {segmentOptions.map((profile) => (
                  <option key={profile.segment_code} value={profile.segment_code}>{profile.segment_name}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-500">{number(total, 0)} authorised customers</p>
          </div>

          {error && <div className="mb-4 rounded-xl bg-rose-500/10 p-3 text-xs text-rose-500">{error}</div>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-3">Customer</th><th className="px-3 py-3">Segment</th>
                  <th className="px-3 py-3">Revenue</th><th className="px-3 py-3">Orders</th>
                  <th className="px-3 py-3">AOV</th><th className="px-3 py-3">Engagement</th>
                  <th className="px-3 py-3">Recency</th><th className="px-3 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item) => (
                  <tr key={item.customer_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-3 py-3 font-mono font-semibold">{item.external_customer_id}</td>
                    <td className="px-3 py-3"><Badge variant="info">{item.segment_name}</Badge></td>
                    <td className="px-3 py-3 font-semibold text-indigo-500">{money(item.total_revenue)}</td>
                    <td className="px-3 py-3">{number(item.order_count, 0)}</td>
                    <td className="px-3 py-3">{money(item.average_order_value)}</td>
                    <td className="px-3 py-3">{number(item.engagement_score)}</td>
                    <td className="px-3 py-3">{number(item.recency_days, 0)} days</td>
                    <td className="px-3 py-3 text-right">
                      <Button variant="ghost" size="sm" icon={Eye} onClick={() => setSelected(item)}>View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!items.length && !loading && <p className="py-10 text-center text-xs text-slate-500">No authorised customers match these filters.</p>}
            {loading && <p className="py-10 text-center text-xs text-slate-500">Loading customer behaviour…</p>}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
            <Button variant="secondary" size="sm" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={page === 0}>Previous</Button>
            <p className="text-xs text-slate-500">Page {page + 1} of {pageCount}</p>
            <Button variant="secondary" size="sm" onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} disabled={page + 1 >= pageCount}>Next</Button>
          </div>
        </Card>
      ) : (
        <Card hoverEffect={false}>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Store summary access</p>
          <p className="mt-1 text-xs text-slate-500">
            Store Managers receive aggregated segment information. Individual customer membership is restricted by backend RBAC.
          </p>
        </Card>
      )}

      <Modal isOpen={Boolean(selected)} onClose={() => setSelected(null)} title="Customer behaviour details" maxWidth="max-w-2xl">
        {selected && (
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Customer ID', selected.external_customer_id], ['Segment', selected.segment_name],
              ['Total revenue', money(selected.total_revenue)], ['Order count', number(selected.order_count, 0)],
              ['Average order value', money(selected.average_order_value)], ['Average basket size', number(selected.average_basket_size)],
              ['Purchase frequency (30d)', number(selected.purchase_frequency_30d)], ['Active months', number(selected.active_months, 0)],
              ['Product variety', number(selected.product_variety, 0)], ['Return rate', `${number(Number(selected.return_rate) * 100)}%`],
              ['Engagement score', number(selected.engagement_score)], ['Recency', `${number(selected.recency_days, 0)} days`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};
