import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { KPIGrid } from '../components/KPICard';
import SalesTrendChart from '../components/charts/SalesTrendChart';
import { useDashboardData } from '../hooks/useDashboardData';
import { getSalesDashboard } from '../api/dashboard';

export default function SalesDashboard() {
  const { kpi, salesTrend, loading, error } = useDashboardData();
  const [welcome, setWelcome] = useState(null);

  useEffect(() => {
    getSalesDashboard().then(setWelcome).catch(() => setWelcome(null));
  }, []);

  return (
    <AppLayout
      eyebrow="Sales Executive"
      title="Your sales"
      subtitle={welcome?.message || "Track performance and forecast what's next."}
    >
      {error && <div className="mm-alert-banner">{error}</div>}
      {loading ? (
        <p className="mm-loading-tag">Loading dashboard…</p>
      ) : (
        <>
          <KPIGrid data={kpi} />

          <div className="mm-panel">
            <div className="mm-panel-title">Sales trend</div>
            <div className="mm-panel-sub">Revenue by month</div>
            <SalesTrendChart data={salesTrend} />
          </div>

          <div className="mm-panel">
            <div className="mm-panel-title">Need a forecast?</div>
            <div className="mm-panel-sub">Run the trained sales model for a specific order profile.</div>
            <Link to="/predict" className="mm-btn secondary">
              Go to Sales Forecast →
            </Link>
          </div>
        </>
      )}
    </AppLayout>
  );
}
