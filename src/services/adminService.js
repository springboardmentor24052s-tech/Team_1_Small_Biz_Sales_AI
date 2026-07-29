import api from './api';

export const adminService = {
  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  inviteUser: async (userData) => {
    const response = await api.post('/admin/users/invite', userData);
    return response.data;
  },

  updateUserRole: async (userId, role) => {
    const response = await api.patch(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  toggleUserStatus: async (userId, status) => {
    const response = await api.patch(`/admin/users/${userId}/status`, { status });
    return response.data;
  },

  getAuditLogs: async () => {
    const response = await api.get('/admin/logs');
    return response.data;
  },
};

export default adminService;
