import { request } from '../api/client';

export const churnService = {
  getChurnSummary: async (tenantId, storeId) => {
    const params = new URLSearchParams();
    if (tenantId) params.append('tenant_id', tenantId);
    if (storeId) params.append('store_id', storeId);
    const queryString = params.toString();
    return await request(queryString ? `/churn/summary?${queryString}` : '/churn/summary');
  },

  getChurnCustomers: async (tenantId, riskLevel, limit = 50, offset = 0) => {
    const params = new URLSearchParams({ limit, offset });
    if (tenantId) params.append('tenant_id', tenantId);
    if (riskLevel) params.append('risk_level', riskLevel);
    return await request(`/churn/customers?${params.toString()}`);
  }
};
