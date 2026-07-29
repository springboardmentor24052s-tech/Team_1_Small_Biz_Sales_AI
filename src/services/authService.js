import api from './api';

export const authService = {
  // Login API call (handles JSON or OAuth2 Form Data fallback)
  login: async (email, password) => {
    try {
      // Try JSON login payload first
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (err) {
      // Fallback: try form-urlencoded standard OAuth2 token endpoint
      try {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const formResponse = await api.post('/auth/login', formData, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        return formResponse.data;
      } catch (fallbackErr) {
        throw err;
      }
    }
  },

  // Fetch current user profile
  getProfile: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (err) {
      const response = await api.get('/users/me');
      return response.data;
    }
  },

  // Refresh JWT access token
  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },

  // Trigger forgot password email
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Register new user account
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Verify email address with token
  verifyEmail: async (token) => {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  },
};

export default authService;
