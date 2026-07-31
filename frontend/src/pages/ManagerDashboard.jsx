import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { KPIGrid } from '../components/KPICard';
import TopCategoryChart from '../components/charts/TopCategoryChart';
import { useDashboardData } from '../hooks/useDashboardData';
import { getManagerDashboard } from '../api/dashboard';
import { listInventory } from '../api/inventory';

export default function ManagerDashboard() {
  const { kpi, topCategory, loading, error } = useDashboardData();
  const [welcome, setWelcome] = useState(null);
  const [items, setItems] = useState([]);
  const [invError, setInvError] = useState('');

  useEffect(() => {
    getManagerDashboard().then(setWelcome).catch(() => setWelcome(null));
    listInventory()
      .then((data) => setItems([...data].sort((a, b) => (a.quantity ?? 0) - (b.quantity ?? 0)).slice(0, 6)))
      .catch(() => setInvError('Could not load inventory.'));
  }, []);

  return (
    <AppLayout
      eyebrow="Store Manager"
      title="Store operations"
      subtitle={welcome?.message || 'Stock levels and store-level sales performance.'}
    >
      {error && <div className="mm-alert-banner">{error}</div>}
      {loading ? (
        <p className="mm-loading-tag">Loading dashboard…</p>
      ) : (
        <>
          <KPIGrid data={kpi} />

          <div className="mm-panel-grid-2">
            <div className="mm-panel">
              <div className="mm-panel-title">Top categories</div>
              <div className="mm-panel-sub">What's moving in-store</div>
              <TopCategoryChart data={topCategory?.['Category Wise Sales']} />
            </div>

            <div className="mm-panel">
              <div className="mm-panel-title">Lowest stock on hand</div>
              <div className="mm-panel-sub">From GET /inventory, sorted lowest quantity first</div>
              {invError && <div className="mm-alert-banner">{invError}</div>}
              {items.length === 0 ? (
                <p className="mm-loading-tag">No inventory records yet.</p>
              ) : (
                <div className="mm-table-wrap">
                  <table className="mm-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.product_name}</td>
                          <td>{item.category}</td>
                          <td className="mm-mono">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
