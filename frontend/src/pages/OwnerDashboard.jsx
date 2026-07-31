import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { KPIGrid } from '../components/KPICard';
import SalesTrendChart from '../components/charts/SalesTrendChart';
import TopCategoryChart from '../components/charts/TopCategoryChart';
import StateRevenueChart from '../components/charts/StateRevenueChart';
import { useDashboardData } from '../hooks/useDashboardData';
import { getOwnerDashboard } from '../api/dashboard';

export default function OwnerDashboard() {
  const { kpi, salesTrend, topCategory, stateRevenue, loading, error } = useDashboardData();
  const [welcome, setWelcome] = useState(null);

  useEffect(() => {
    getOwnerDashboard().then(setWelcome).catch(() => setWelcome(null));
  }, []);

  return (
    <AppLayout
      eyebrow="Business Owner"
      title="Business overview"
      subtitle={welcome?.message || 'How the business is performing, at a glance.'}
    >
      {error && <div className="mm-alert-banner">{error}</div>}
      {loading ? (
        <p className="mm-loading-tag">Loading dashboard…</p>
      ) : (
        <>
          <KPIGrid data={kpi} />

          <div className="mm-panel-grid-2">
            <div className="mm-panel">
              <div className="mm-panel-title">Sales trend</div>
              <div className="mm-panel-sub">Revenue by month</div>
              <SalesTrendChart data={salesTrend} />
            </div>
            <div className="mm-panel">
              <div className="mm-panel-title">
                Top category{topCategory ? `: ${topCategory['Top Selling Category']}` : ''}
              </div>
              <div className="mm-panel-sub">Units sold by category</div>
              <TopCategoryChart data={topCategory?.['Category Wise Sales']} />
            </div>
          </div>

          <div className="mm-panel">
            <div className="mm-panel-title">
              Revenue by state{stateRevenue ? ` — top: ${stateRevenue['Highest Revenue State']}` : ''}
            </div>
            <div className="mm-panel-sub">Where your customers are buying from</div>
            <StateRevenueChart data={stateRevenue?.['State Wise Revenue']} />
          </div>
        </>
      )}
    </AppLayout>
  );
}
