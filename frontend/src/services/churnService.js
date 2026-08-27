import api from './api';

export const churnService = {
  getChurnSummary: async (tenantId, storeId) => {
    const params = {};
    if (tenantId) params.tenant_id = tenantId;
    if (storeId) params.store_id = storeId;
    const response = await api.get('/api/v1/churn/summary', { params });
    return response.data;
  },

  getChurnCustomers: async (tenantId, riskLevel, limit = 50, offset = 0) => {
    const params = { limit, offset };
    if (tenantId) params.tenant_id = tenantId;
    if (riskLevel) params.risk_level = riskLevel;
    const response = await api.get('/api/v1/churn/customers', { params });
    return response.data;
  }
};
