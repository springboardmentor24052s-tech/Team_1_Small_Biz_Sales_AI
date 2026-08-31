import { request } from '../api/client';

export const recommendationService = {
  // Fetch intelligent product recommendations with optional role & parameters
  getRecommendations: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const url = queryParams ? `/recommendations?${queryParams}` : '/recommendations';
    return await request(url);
  },

  // Fetch recommendation analytics summary metrics
  getAnalytics: async () => {
    return await request('/recommendations/analytics');
  },

  // Fetch recommendation model evaluation metrics (Precision@K & Recall@K)
  getEvaluation: async (k = 5) => {
    return await request(`/recommendations/evaluation?k=${k}`);
  },

  // Fetch data-driven natural-language insights
  getInsights: async () => {
    return await request('/recommendations/insights');
  },

  // Fetch live customer list for customer selector
  getCustomers: async () => {
    return await request('/customers?limit=200');
  },

  // Fetch live inventory/product list for SKU selector
  getProducts: async () => {
    return await request('/inventory?limit=200');
  },
};

export default recommendationService;
