import api from './api';

export const recommendationService = {
  // Fetch intelligent product recommendations with optional role & parameters
  getRecommendations: async (params = {}) => {
    const response = await api.get('/recommendations', { params });
    return response.data;
  },

  // Fetch recommendation analytics summary metrics
  getAnalytics: async () => {
    const response = await api.get('/recommendations/analytics');
    return response.data;
  },

  // Fetch recommendation model evaluation metrics (Precision@K & Recall@K)
  getEvaluation: async (k = 5) => {
    const response = await api.get('/recommendations/evaluation', { params: { k } });
    return response.data;
  },

  // Fetch data-driven natural-language insights
  getInsights: async () => {
    const response = await api.get('/recommendations/insights');
    return response.data;
  },

  // Fetch live customer list for customer selector
  getCustomers: async () => {
    const response = await api.get('/customers', { params: { limit: 200 } });
    return response.data;
  },

  // Fetch live inventory/product list for SKU selector
  getProducts: async () => {
    const response = await api.get('/inventory', { params: { limit: 200 } });
    return response.data;
  },
};

export default recommendationService;
