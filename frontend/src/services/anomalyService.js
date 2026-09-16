import { request } from '../api/client';

export const anomalyService = {
  getAnomalies: async (tenantId, severity, contamination = 0.05) => {
    const params = new URLSearchParams({ contamination });
    if (tenantId) params.append('tenant_id', tenantId);
    if (severity) params.append('severity', severity);
    return await request(`/anomalies?${params.toString()}`);
  },

  acknowledgeAnomaly: async (eventId, notes = '') => {
    return await request(`/anomalies/${eventId}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    });
  },

  resolveAnomaly: async (eventId, notes = '') => {
    return await request(`/anomalies/${eventId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    });
  }
};
