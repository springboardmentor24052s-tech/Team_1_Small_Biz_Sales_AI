import client from './client';

// GET /users -> list of UserResponse (id, username, email, role_id, is_active)
export async function listUsers() {
  const { data } = await client.get('/users');
  return Array.isArray(data) ? data : [];
}

// PUT /users/{id}/status expects { is_active: boolean } — restricted to
// Administrator (role_id 1) on the backend.
export async function updateUserStatus(userId, isActive) {
  const { data } = await client.put(`/users/${userId}/status`, { is_active: isActive });
  return data;
}

// PUT /users/{id}/role expects { role_id: number } — restricted to Administrator.
export async function updateUserRole(userId, roleId) {
  const { data } = await client.put(`/users/${userId}/role`, { role_id: roleId });
  return data;
}

// DELETE /users/{id} — restricted to Administrator.
export async function deleteUser(userId) {
  const { data } = await client.delete(`/users/${userId}`);
  return data;
}
