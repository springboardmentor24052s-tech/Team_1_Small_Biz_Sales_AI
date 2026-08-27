import api from './api';

export const anomalyService = {
  getAnomalies: async (tenantId, severity, contamination = 0.05) => {
    const params = { contamination };
    if (tenantId) params.tenant_id = tenantId;
    if (severity) params.severity = severity;
    const response = await api.get('/api/v1/anomalies', { params });
    return response.data;
  },

  acknowledgeAnomaly: async (eventId, notes = '') => {
    const response = await api.post(`/api/v1/anomalies/${eventId}/acknowledge`, { notes });
    return response.data;
  },

  resolveAnomaly: async (eventId, notes = '') => {
    const response = await api.post(`/api/v1/anomalies/${eventId}/resolve`, { notes });
    return response.data;
  }
};
