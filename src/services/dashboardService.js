import api from './api';

export const dashboardService = {
  getOwnerMetrics: async () => {
    const response = await api.get('/dashboard/owner');
    return response.data;
  },

  getManagerMetrics: async () => {
    const response = await api.get('/dashboard/manager');
    return response.data;
  },

  getSalesMetrics: async () => {
    const response = await api.get('/dashboard/sales');
    return response.data;
  },

  getAdminMetrics: async () => {
    const response = await api.get('/dashboard/admin');
    return response.data;
  },
};

export default dashboardService;
