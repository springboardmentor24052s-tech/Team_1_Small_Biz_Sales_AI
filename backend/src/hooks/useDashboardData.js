import { useEffect, useState } from 'react';
import {
  getKpis,
  getSalesTrend,
  getTopCategory,
  getStateRevenue,
  getCategoryRevenue,
} from '../api/dashboard';

/**
 * Fetches the shared analytics datasets used across every dashboard page.
 * None of these are role-restricted on the backend, so every dashboard can
 * show the same charts alongside its role-specific welcome data.
 * Each call fails independently so one broken endpoint doesn't blank the
 * whole page.
 */
export function useDashboardData() {
  const [state, setState] = useState({
    kpi: null,
    salesTrend: null,
    topCategory: null,
    stateRevenue: null,
    categoryRevenue: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const results = await Promise.allSettled([
        getKpis(),
        getSalesTrend(),
        getTopCategory(),
        getStateRevenue(),
        getCategoryRevenue(),
      ]);

      if (cancelled) return;

      const [kpi, salesTrend, topCategory, stateRevenue, categoryRevenue] = results;
      setState({
        kpi: kpi.status === 'fulfilled' ? kpi.value : null,
        salesTrend: salesTrend.status === 'fulfilled' ? salesTrend.value : null,
        topCategory: topCategory.status === 'fulfilled' ? topCategory.value : null,
        stateRevenue: stateRevenue.status === 'fulfilled' ? stateRevenue.value : null,
        categoryRevenue: categoryRevenue.status === 'fulfilled' ? categoryRevenue.value : null,
        loading: false,
        error: results.every((r) => r.status === 'rejected')
          ? 'Could not reach the backend. Is it running, and is CORS enabled?'
          : null,
      });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
